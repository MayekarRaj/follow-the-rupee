"use client";

import { useEffect, useState } from "react";

export type Ward = {
  ward_code: string;
  ward_name: string;
  budget_inr: number;
  spend_inr: number;
  utilisation_pct: number;
  remaining_inr: number;
  jobs: number;
  low_lying_index: number;
  spend_by_contractor: Record<string, number>;
  spend_by_method: Record<string, number>;
  failed_fix_spend_inr: number;
  flagged_excess_inr: number;
  flags: Record<string, number>;
  sla_met_pct: number;
};

export type FlagType =
  | "OVERBILLED"
  | "DUPLICATE_BILL"
  | "DLP_PAID"
  | "DLP_REVIEW";

export type Flag = {
  work_order_id: string;
  flag: FlagType;
  severity: string;
  reason: string;
  excess_inr: number;
  ward: string;
  road: string;
  contractor: string;
  method: string;
  work_type: string;
  area_sqm: number;
  billed_inr: number;
  rate_card_inr: number;
  cost_ratio: number;
  completed_at: string;
  linked_complaints: string | null;
  original_work_order: string | null;
  road_resurfaced_on: string | null;
};

export type QueueItem = {
  road_id: string;
  road_name: string;
  risk_score: number;
  issue: string;
  method: string;
  est_cost_inr: number;
  funding: string;
  fundable_now: boolean;
};

export type NextRupee = Record<
  string,
  { remaining_budget_inr: number; planned_spend_inr: number; queue: QueueItem[] }
>;

export type Thresholds = {
  overbill_ratio: number;
  dup_window_days: number;
  surface_work_types: string[];
};

export type Contractors = {
  context_check: {
    reopen_by_rain_quartile_pct: number[];
    reopen_by_low_lying_band_pct: Record<string, number>;
    note: string;
  };
};

export type Summary = {
  thresholds: Thresholds;
  total_spend_inr: number;
  work_orders: number;
  flagged_excess_inr: number;
  flagged_work_orders: number;
  flag_counts: Record<string, number>;
};

const cache = new Map<string, Promise<unknown>>();

/**
 * Fetch a /data/*.json file. The engine currently writes bare `NaN` for missing
 * values (invalid JSON), so parse from text and map NaN -> null.
 */
export function loadData<T>(file: string): Promise<T> {
  let p = cache.get(file);
  if (!p) {
    p = fetch(`/data/${file}`)
      .then((r) => {
        if (!r.ok) throw new Error(`${file}: HTTP ${r.status}`);
        return r.text();
      })
      .then((t) => JSON.parse(t.replace(/:\s*-?NaN\b/g, ": null")) as T)
      .catch((e) => {
        cache.delete(file);
        throw e;
      });
    cache.set(file, p);
  }
  return p as Promise<T>;
}

export function useData<T>(file: string): {
  data: T | null;
  error: string | null;
} {
  const [state, setState] = useState<{ data: T | null; error: string | null }>({
    data: null,
    error: null,
  });
  useEffect(() => {
    let live = true;
    loadData<T>(file)
      .then((data) => live && setState({ data, error: null }))
      .catch((e) => live && setState({ data: null, error: String(e.message ?? e) }));
    return () => {
      live = false;
    };
  }, [file]);
  return state;
}

export const DEFAULT_WARD = "F/N";
export type Role = "commissioner" | "ward" | "citizen";
export const ROLES: { value: Role; label: string }[] = [
  { value: "commissioner", label: "Commissioner" },
  { value: "ward", label: "Ward officer" },
  { value: "citizen", label: "Citizen" },
];
