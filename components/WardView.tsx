"use client";

import { useMemo, useState } from "react";
import { cleanName, FLAG_LABEL, inr, inrShort, pct } from "@/lib/format";
import {
  useData,
  type Flag,
  type FlagType,
  type NextRupee,
  type QueueItem,
  type Ward,
} from "@/lib/data";
import FlagDrawer from "./FlagDrawer";

const GROUP_ORDER: FlagType[] = [
  "OVERBILLED",
  "DUPLICATE_BILL",
  "DLP_PAID",
  "DLP_REVIEW",
];

function cta(type: FlagType): string {
  if (type === "OVERBILLED" || type === "DUPLICATE_BILL")
    return "Raise recovery";
  if (type === "DLP_PAID") return "Send back to original contractor (DLP)";
  return "Check against warranty (DLP)";
}

function Kpi({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "red";
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 text-xl font-bold sm:text-2xl ${
          tone === "red" ? "text-red-600" : "text-slate-900"
        }`}
      >
        {value}
      </p>
      {sub && (
        <p
          className={`text-xs ${tone === "red" ? "text-red-600" : "text-slate-500"}`}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function ActionQueue({
  flags,
  onOpen,
}: {
  flags: Flag[];
  onOpen: (f: Flag) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => {
    return GROUP_ORDER.map((type) => {
      const rows = flags
        .filter((f) => f.flag === type)
        .sort((a, b) => b.excess_inr - a.excess_inr);
      return {
        type,
        rows,
        total: rows.reduce((s, r) => s + r.excess_inr, 0),
      };
    })
      .filter((g) => g.rows.length > 0)
      .sort((a, b) => b.total - a.total);
  }, [flags]);

  if (groups.length === 0)
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        Nothing needs review in this ward.
      </p>
    );

  return (
    <div className="space-y-4">
      {groups.map((g) => {
        const open = expanded[g.type];
        const shown = open ? g.rows : g.rows.slice(0, 5);
        return (
          <div
            key={g.type}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
              <h3 className="text-sm font-semibold text-slate-900">
                {FLAG_LABEL[g.type]}
              </h3>
              <p className="text-sm text-slate-600">
                {g.rows.length} {g.rows.length === 1 ? "work order" : "work orders"}
                {g.total > 0 && (
                  <>
                    {" · "}
                    <span className="font-semibold text-slate-900">
                      {inr(g.total)}
                    </span>
                  </>
                )}
              </p>
            </div>
            <ul className="divide-y divide-slate-100">
              {shown.map((f) => (
                <li key={f.work_order_id}>
                  <button
                    onClick={() => onOpen(f)}
                    className="block w-full px-4 py-3 text-left hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          <span className="font-mono">{f.work_order_id}</span>
                          <span className="font-normal text-slate-500">
                            {" · "}
                            {f.road}
                          </span>
                        </p>
                        <p className="text-xs text-slate-500">
                          {cleanName(f.contractor)}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-bold text-slate-900">
                        {f.excess_inr > 0 ? inr(f.excess_inr) : "No excess"}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{f.reason}</p>
                    <p className="mt-2 inline-block rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white">
                      {cta(g.type)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
            {g.rows.length > 5 && (
              <button
                onClick={() =>
                  setExpanded((e) => ({ ...e, [g.type]: !e[g.type] }))
                }
                className="w-full border-t border-slate-100 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-slate-50"
              >
                {open ? "Show fewer" : `Show all ${g.rows.length}`}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FundingBadge({ q }: { q: QueueItem }) {
  const dlp = q.funding.startsWith("Original contractor");
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
        dlp ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
      }`}
    >
      {dlp ? "₹0 – DLP contractor" : "Ward budget"}
    </span>
  );
}

function NextRupeeSection({
  data,
}: {
  data: NextRupee[string] | undefined;
}) {
  if (!data)
    return <p className="text-sm text-slate-600">No queue for this ward.</p>;
  const over = data.remaining_budget_inr < 0;
  return (
    <>
      {over && (
        <div
          role="alert"
          className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800"
        >
          Ward overspent by {inr(-data.remaining_budget_inr)}: only ₹0 DLP
          fixes possible; request reallocation.
        </div>
      )}
      <ul className="space-y-2">
        {data.queue.map((q) => (
          <li
            key={q.road_id}
            className={`rounded-xl border border-slate-200 bg-white p-3 ${
              q.fundable_now ? "" : "opacity-50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {q.road_name}
                </p>
                <p className="text-xs text-slate-500">
                  {q.issue} · {q.method}
                </p>
              </div>
              <p className="shrink-0 text-sm font-bold text-slate-900">
                {inr(q.est_cost_inr)}
              </p>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div
                className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"
                role="img"
                aria-label={`Risk score ${q.risk_score} out of 100`}
              >
                <div
                  className="h-full rounded-full bg-orange-500"
                  style={{ width: `${Math.min(100, Math.max(0, q.risk_score))}%` }}
                />
              </div>
              <span className="w-10 text-right text-xs font-semibold text-slate-700">
                {q.risk_score.toFixed(1)}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <FundingBadge q={q} />
              {!q.fundable_now && (
                <span className="text-xs text-slate-500">
                  Doesn’t fit remaining budget
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function ContractorBars({ ward }: { ward: Ward }) {
  const rows = Object.entries(ward.spend_by_contractor).sort(
    (a, b) => b[1] - a[1],
  );
  const max = rows[0]?.[1] || 1;
  return (
    <ul className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
      {rows.map(([name, v]) => (
        <li key={name}>
          <div className="flex justify-between text-sm">
            <span className="text-slate-700">{cleanName(name)}</span>
            <span className="font-semibold text-slate-900">{inrShort(v)}</span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-500"
              style={{ width: `${(v / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function WardView({ wardCode }: { wardCode: string }) {
  const wards = useData<Ward[]>("wards.json");
  const flags = useData<Flag[]>("flags.json");
  const next = useData<NextRupee>("next_rupee.json");
  const [selected, setSelected] = useState<Flag | null>(null);

  const error = wards.error || flags.error || next.error;
  const ward = wards.data?.find((w) => w.ward_code === wardCode);
  const wardFlags = useMemo(
    () => (flags.data ?? []).filter((f) => f.ward === wardCode),
    [flags.data, wardCode],
  );

  if (error)
    return (
      <main className="mx-auto max-w-5xl px-4 py-6">
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Couldn’t load the data: {error}
        </p>
      </main>
    );
  if (!wards.data || !flags.data || !next.data)
    return (
      <main className="mx-auto max-w-5xl px-4 py-6">
        <p className="text-sm text-slate-500">Loading ward data…</p>
      </main>
    );
  if (!ward)
    return (
      <main className="mx-auto max-w-5xl px-4 py-6">
        <p className="text-sm text-slate-700">
          Unknown ward “{wardCode}”. Pick one from the Ward menu.
        </p>
      </main>
    );

  const overspent = ward.utilisation_pct > 100;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <p className="text-sm text-slate-500">Ward officer view</p>
      <h2 className="text-2xl font-bold text-slate-900">
        Ward {ward.ward_code}
        <span className="font-normal text-slate-500"> · {ward.ward_name}</span>
      </h2>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Budget" value={inrShort(ward.budget_inr)} sub={inr(ward.budget_inr)} />
        <Kpi
          label="Spent"
          value={inrShort(ward.spend_inr)}
          sub={`${pct(ward.utilisation_pct)} of budget${overspent ? " (over)" : ""}`}
          tone={overspent ? "red" : "default"}
        />
        <Kpi
          label="Flagged money"
          value={inrShort(ward.flagged_excess_inr)}
          sub={`${wardFlags.length} work orders need review`}
        />
        <Kpi
          label="Failed fixes"
          value={inrShort(ward.failed_fix_spend_inr)}
          sub="Spent on repairs that re-opened"
        />
      </div>

      <Section title="Action queue: recover money">
        <ActionQueue flags={wardFlags} onOpen={setSelected} />
      </Section>

      <Section
        title="Next rupee"
        right={
          next.data[wardCode] && (
            <p
              className={`text-sm font-semibold ${
                next.data[wardCode].remaining_budget_inr < 0
                  ? "text-red-600"
                  : "text-slate-700"
              }`}
            >
              Remaining {inr(next.data[wardCode].remaining_budget_inr)}
            </p>
          )
        }
      >
        <NextRupeeSection data={next.data[wardCode]} />
      </Section>

      <Section title="Contractors in this ward">
        <ContractorBars ward={ward} />
      </Section>

      {selected && (
        <FlagDrawer
          flag={selected}
          allFlags={flags.data}
          onClose={() => setSelected(null)}
        />
      )}
    </main>
  );
}
