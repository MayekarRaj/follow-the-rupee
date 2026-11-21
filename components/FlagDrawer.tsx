"use client";

import { useEffect, useState } from "react";
import { cleanName, FLAG_LABEL, inr, pct } from "@/lib/format";
import type { Flag } from "@/lib/data";

function Field({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-1.5 text-sm">
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-right font-medium text-slate-900">{v}</dd>
    </div>
  );
}

function WorkOrderCard({
  title,
  f,
  id,
}: {
  title: string;
  f: Flag | null;
  id: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="font-mono text-sm font-semibold">{id}</p>
      {f ? (
        <dl className="mt-1">
          <Field k="Date" v={f.completed_at} />
          <Field k="Road" v={f.road} />
          <Field k="Contractor" v={cleanName(f.contractor)} />
          <Field k="Method" v={f.method} />
          <Field k="Area" v={`${f.area_sqm} sq m`} />
          <Field k="Billed" v={inr(f.billed_inr)} />
        </dl>
      ) : (
        <p className="mt-1 text-xs text-slate-500">
          Not in the flagged list (it is the earlier, un-flagged bill).
        </p>
      )}
    </div>
  );
}

export default function FlagDrawer({
  flag,
  allFlags,
  onClose,
}: {
  flag: Flag;
  allFlags: Flag[];
  onClose: () => void;
}) {
  const [explain, setExplain] = useState<{
    text: string;
    fallback: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  async function runExplain() {
    setLoading(true);
    try {
      const r = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "flag", record: flag }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      if (!j.text) throw new Error("empty");
      setExplain({ text: j.text, fallback: false });
    } catch {
      // Spec: the demo must never break; fall back to the engine's reason text.
      setExplain({ text: flag.reason, fallback: true });
    } finally {
      setLoading(false);
    }
  }

  const original = flag.original_work_order
    ? (allFlags.find((x) => x.work_order_id === flag.original_work_order) ??
      null)
    : null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-stretch sm:justify-end">
      <button
        aria-label="Close"
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Flag details for ${flag.work_order_id}`}
        className="relative max-h-[88vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl sm:max-h-none sm:w-[28rem] sm:rounded-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Needs review
            </p>
            <h2 className="text-lg font-bold">{FLAG_LABEL[flag.flag]}</h2>
            <p className="font-mono text-sm text-slate-600">
              {flag.work_order_id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-slate-300 px-2.5 py-1 text-sm hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <p className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
          {flag.reason}
        </p>

        {flag.flag === "DUPLICATE_BILL" && flag.original_work_order && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <WorkOrderCard
              title="Original"
              f={original}
              id={flag.original_work_order}
            />
            <WorkOrderCard
              title="Flagged copy"
              f={flag}
              id={flag.work_order_id}
            />
          </div>
        )}

        {flag.flag === "DLP_PAID" && flag.road_resurfaced_on && (
          <p className="mt-3 rounded-md bg-sky-50 p-3 text-sm text-sky-900">
            Road resurfaced on {flag.road_resurfaced_on}; still in warranty.
          </p>
        )}

        <dl className="mt-4">
          <Field k="Work order" v={<span className="font-mono">{flag.work_order_id}</span>} />
          <Field k="Ward" v={flag.ward} />
          <Field k="Road" v={flag.road} />
          <Field k="Contractor" v={cleanName(flag.contractor)} />
          <Field k="Method" v={flag.method} />
          <Field k="Work type" v={flag.work_type} />
          <Field k="Area" v={`${flag.area_sqm} sq m`} />
          <Field k="Completed" v={flag.completed_at} />
          <Field k="Billed" v={inr(flag.billed_inr)} />
          <Field k="Rate card" v={inr(flag.rate_card_inr)} />
          <Field
            k="Billed vs rate card"
            v={`${flag.cost_ratio.toFixed(2)}x`}
          />
          <Field k="Excess (needs review)" v={inr(flag.excess_inr)} />
          <Field k="Severity" v={flag.severity} />
          {flag.road_resurfaced_on && (
            <Field k="Road resurfaced on" v={flag.road_resurfaced_on} />
          )}
          {flag.original_work_order && (
            <Field
              k="Original work order"
              v={<span className="font-mono">{flag.original_work_order}</span>}
            />
          )}
          <Field
            k="Linked complaints"
            v={
              flag.linked_complaints ? (
                <span className="font-mono text-xs">
                  {flag.linked_complaints.split("|").join(", ")}
                </span>
              ) : (
                "None"
              )
            }
          />
        </dl>

        <button
          onClick={runExplain}
          disabled={loading}
          className="mt-4 w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Explaining…" : "Explain"}
        </button>
        {explain && (
          <p className="mt-3 rounded-md bg-slate-100 p-3 text-sm text-slate-800">
            {explain.text}
            {explain.fallback && (
              <span className="mt-1 block text-xs text-slate-500">
                Showing the audit reason (AI explanation unavailable).
              </span>
            )}
          </p>
        )}
        <p className="mt-3 text-xs text-slate-500">
          Flags are evidence for review ({pct(flag.cost_ratio * 100, 0)} of rate
          card billed), not verdicts.
        </p>
      </aside>
    </div>
  );
}
