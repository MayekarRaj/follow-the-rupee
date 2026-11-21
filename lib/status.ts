"use client";

import { useMemo, useSyncExternalStore } from "react";
import { createStore } from "./store";

export type Status = "new" | "review" | "recovered" | "dismissed";
export type StatusRecord = { status: Status; reason?: string; at: number };
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
  return map[key] ?? { status: "new", at: 0 };
}

export function setStatus(key: string, status: Status, reason?: string) {
  const map = parse(store.get());
  map[key] = { status, at: Date.now(), ...(reason ? { reason } : {}) };
  store.set(JSON.stringify(map));
}
