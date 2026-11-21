"use client";

import { useMemo, useSyncExternalStore } from "react";
import { createStore } from "./store";

export type Status = "new" | "review" | "contested" | "recovered" | "dismissed";
export type StatusRecord = {
  status: Status;
  reason?: string;
  /** Optional evidence note, used when the contractor contests. */
  note?: string;
  at: number;
  /** Written on every save; same moment as `at`. */
  updatedAt: number;
};
export type StatusMap = Record<string, StatusRecord>;

const store = createStore("ftr.flagStatus.v1");

export const flagKey = (f: { work_order_id: string; flag: string }) =>
  `${f.work_order_id}|${f.flag}`;

function parse(raw: string): StatusMap {
  if (!raw) return {};
  try {
    const o = JSON.parse(raw);
    return o && typeof o === "object" ? (o as StatusMap) : {};
  } catch {
    return {};
  }
}

export function useStatuses(): StatusMap {
  const raw = useSyncExternalStore(store.subscribe, store.get, () => "");
  return useMemo(() => parse(raw), [raw]);
}

export function statusOf(map: StatusMap, key: string): StatusRecord {
  return map[key] ?? { status: "new", at: 0, updatedAt: 0 };
}

export function setStatus(
  key: string,
  status: Status,
  reason?: string,
  note?: string,
) {
  const map = parse(store.get());
  const now = Date.now();
  map[key] = {
    status,
    at: now,
    updatedAt: now,
    ...(reason ? { reason } : {}),
    ...(note ? { note } : {}),
  };
  store.set(JSON.stringify(map));
}

/* ---------- shared helpers: one status per flag, read by work order ---------- */

export type StatusRow = StatusRecord & { key: string; woId: string; flag: string };

/** All saved statuses, newest first. */
export function statusRows(map: StatusMap): StatusRow[] {
  return Object.entries(map)
    .map(([key, r]) => {
      const [woId, flag = ""] = key.split("|");
      return { ...r, updatedAt: r.updatedAt ?? r.at, key, woId, flag };
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function listStatuses(): StatusRow[] {
  return statusRows(parse(store.get()));
}

/**
 * Status of a work order. Statuses are saved per flag, and a work order can
 * carry several, so this returns the most recently changed one that is past
 * "new" (or null when the ward office has not touched it).
 */
export function statusForWo(map: StatusMap, woId: string): StatusRow | null {
  return statusRows(map).find((r) => r.woId === woId && r.status !== "new") ?? null;
}

export function getStatus(woId: string): StatusRow | null {
  return statusForWo(parse(store.get()), woId);
}

/** "just now", "5 min ago", "3 h ago", "2 days ago". */
export function timeAgo(at: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return `${d} ${d === 1 ? "day" : "days"} ago`;
}

/* ---------- citizen follow-ups (own key, same store) ---------- */

export type FollowUp = {
  ref: string;
  complaintId: string;
  woId: string | null;
  text: string;
  at: number;
  updatedAt: number;
};

const fuStore = createStore("ftr.followUps.v1");

function parseFu(raw: string): FollowUp[] {
  if (!raw) return [];
  try {
    const o = JSON.parse(raw);
    return Array.isArray(o) ? (o as FollowUp[]) : [];
  } catch {
    return [];
  }
}

export function useFollowUps(): FollowUp[] {
  const raw = useSyncExternalStore(fuStore.subscribe, fuStore.get, () => "");
  return useMemo(() => parseFu(raw), [raw]);
}

/** Follow-ups whose work order or complaint id equals `id`, newest first. */
export function followUpsFor(all: FollowUp[], id: string): FollowUp[] {
  return all
    .filter((f) => f.woId === id || f.complaintId === id)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function listFollowUps(id: string): FollowUp[] {
  return followUpsFor(parseFu(fuStore.get()), id);
}

// No 0/O/1/I, so a ref read aloud or copied by hand is not ambiguous.
const REF_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Saves a follow-up and returns its ref, "FU-" plus 4 characters. */
export function addFollowUp(
  complaintId: string,
  woId: string | null,
  text: string,
): string {
  const all = parseFu(fuStore.get());
  let ref = "";
  do {
    ref =
      "FU-" +
      Array.from(
        { length: 4 },
        () => REF_CHARS[Math.floor(Math.random() * REF_CHARS.length)],
      ).join("");
  } while (all.some((f) => f.ref === ref));
  const now = Date.now();
  all.push({ ref, complaintId, woId, text, at: now, updatedAt: now });
  fuStore.set(JSON.stringify(all));
  return ref;
}
