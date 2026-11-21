import type { Flag, FlagType, Thresholds } from "./data";

export const NORMAL_RANGE = "0.75–1.30×";
export const WATCH_RANGE = "1.30–1.50×";

const FALLBACK: Thresholds = {
  overbill_ratio: 1.5,
  dup_window_days: 10,
  surface_work_types: ["Broken paver blocks", "Pothole", "Road cave-in"],
};

/** The rule that raised the flag, and the threshold it was measured against. */
export function whyFlagged(
  f: Flag,
  th?: Thresholds | null,
): { rule: string; threshold: string } {
  const t = th ?? FALLBACK;
  switch (f.flag) {
    case "OVERBILLED":
      return {
        rule: "The billed amount is far above the rate card for this kind of work.",
        threshold: `Flagged at ${t.overbill_ratio}× the rate card or more (normal range ${NORMAL_RANGE}). This bill: ${f.cost_ratio.toFixed(2)}×.`,
      };
    case "DUPLICATE_BILL":
      return {
        rule: "Same road, method, contractor and area billed again shortly after an earlier bill, with no citizen complaint linked.",
        threshold: `Window: ${t.dup_window_days} days.${f.original_work_order ? ` Earlier bill: ${f.original_work_order}.` : ""}`,
      };
    case "DLP_PAID":
      return {
        rule: `Road-surface work (${t.surface_work_types.join(", ")}) on a road still inside its Defect Liability Period (DLP), when the original contractor should repair it free.`,
        threshold: f.road_resurfaced_on
          ? `Road resurfaced on ${f.road_resurfaced_on}; still in warranty.`
          : "Road is still in warranty.",
      };
    default:
      return {
        rule: "Drainage or utility work on a road still inside its DLP. Usually not a pavement defect.",
        threshold: `Needs a check on whether the resurfacing caused it${f.road_resurfaced_on ? ` (resurfaced ${f.road_resurfaced_on})` : ""}.`,
      };
  }
}

export const NEXT_STEP: Record<FlagType, { action: string; owner: string }> = {
  DUPLICATE_BILL: {
    action:
      "Verify on site that only one job was done. If so, recover the second bill.",
    owner: "Sub-engineer verifies on site → EE raises recovery",
  },
  OVERBILLED: {
    action:
      "Re-measure the work against the rate card and recover the amount above it.",
    owner: "Sub-engineer re-measures → EE raises recovery",
  },
  DLP_PAID: {
    action:
      "Confirm the defect sits on the warranty road, send the job back to the original contractor and seek recovery of what BMC paid.",
    owner: "Sub-engineer confirms → EE sends back to original contractor",
  },
  DLP_REVIEW: {
    action:
      "Check whether the drainage job was caused by the resurfacing. If yes, treat it as a warranty claim; if not, close it.",
    owner: "Sub-engineer checks on site → EE decides",
  },
};

/** Replaces the normal next step when the engineer's remark points to a utility trench. */
export const UTILITY_NEXT_STEP = {
  action: "Check trench permit; recover reinstatement from the utility agency",
  owner: "Sub-engineer → AE (with utility agency)",
};
