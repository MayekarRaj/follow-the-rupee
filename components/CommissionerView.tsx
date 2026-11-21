"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cleanName, inr, inrShort, pct } from "@/lib/format";
import {
  useData,
  type Contractor,
  type Contractors,
  type Flag,
  type Summary,
  type Ward,
} from "@/lib/data";
import { DICT } from "@/lib/i18n";
import { statusRows, useFollowUps, useStatuses, type Status } from "@/lib/status";
import Stamp from "./Stamp";

/* Labels in this view are English only for now (see DECISIONS.md), so the
   whole view is marked lang="en" for screen readers. */

/** A contractor is marked "needs review" when its re-open rate is above this
 *  multiple of what its method mix would predict. */
const REOPEN_FLAG_RATIO = 1.3;
/** Wards using less than this share of budget count as "under-utilised". */
const UNDER_PCT = 80;
/** The fairness caption is only shown while every spread is within this. */
const FLAT_SPREAD_PTS = 5;

const wardHref = (code: string) =>
  `/?role=ward&ward=${encodeURIComponent(code)}`;

const ratioOf = (c: Contractor) =>
  c.reopen_pct / c.expected_reopen_pct_for_method_mix;
const flagTotal = (c: Contractor) =>
  Object.values(c.flags).reduce((s, n) => s + n, 0);

/* ---------- small layout pieces ---------- */

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="rule-double mb-3 pb-1.5">
        <h2 className="font-sans text-2xl font-bold text-ink">{title}</h2>
        {note && <p className="mt-0.5 text-sm text-ink/75">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Kpi({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`border border-ink/40 bg-paper p-3 sm:p-4 ${className}`}>
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink/70">
        {label}
      </p>
      {children}
    </div>
  );
}

const BIG = "mt-1 font-serif font-bold tabular-nums leading-none";

/** Horizontal scroll area that keyboard users can scroll too. */
function Scroller({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="relative overflow-x-auto border border-ink/40"
    >
      {children}
    </div>
  );
}

/* ---------- headline + KPIs ---------- */

function Headline({
  summary,
  overspent,
  worst,
}: {
  summary: Summary;
  overspent: number;
  worst: Contractor;
}) {
  return (
    <p className="mt-3 max-w-4xl font-sans text-xl font-semibold leading-snug text-ink sm:text-2xl">
      <span className="text-stamp">{inrShort(summary.flagged_excess_inr)}</span>{" "}
      flagged across {summary.flagged_work_orders.toLocaleString("en-IN")} work
      orders citywide. {overspent} {overspent === 1 ? "ward" : "wards"}{" "}
      overspent; worst re-open rate:{" "}
      <span className="whitespace-nowrap">{cleanName(worst.name)}</span> (
      {pct(worst.reopen_pct)} vs {pct(worst.expected_reopen_pct_for_method_mix)}{" "}
      expected).
    </p>
  );
}

function KpiRow({
  summary,
  wards,
  over,
  under,
}: {
  summary: Summary;
  wards: Ward[];
  over: Ward[];
  under: Ward[];
}) {
  const budget = wards.reduce((s, w) => s + w.budget_inr, 0);
  const codes = (list: Ward[]) => list.map((w) => w.ward_code).join(", ");
  return (
    <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-[1fr_1.4fr_1fr_1fr]">
      <Kpi
        label="Total spend"
        className="col-span-2 order-2 border-t-[6px] border-t-road lg:order-none lg:col-span-1"
      >
        <p className={`${BIG} text-3xl`}>{inrShort(summary.total_spend_inr)}</p>
        <p className="mt-1.5 text-xs text-ink/70">
          {pct((summary.total_spend_inr / budget) * 100)} of the{" "}
          {inrShort(budget)} budget · {summary.work_orders.toLocaleString("en-IN")}{" "}
          work orders
        </p>
      </Kpi>

      <Kpi
        label="Flagged money"
        className="col-span-2 order-1 border-t-[8px] border-t-stamp lg:order-none lg:col-span-1"
      >
        <p className={`${BIG} text-5xl text-stamp sm:text-6xl`}>
          {inrShort(summary.flagged_excess_inr)}
        </p>
        <p className="mt-1.5 text-xs text-ink/70">
          across {summary.flagged_work_orders.toLocaleString("en-IN")} work
          orders that need review
        </p>
        <div className="mt-2">
          <Stamp kind="review" small />
        </div>
      </Kpi>

      <Kpi
        label="Wards overspent"
        className="order-3 border-t-[6px] border-t-stamp lg:order-none"
      >
        <p className={`${BIG} text-4xl text-stamp`}>
          <span aria-hidden="true" className="mr-1 text-2xl">
            ▲
          </span>
          {over.length}
        </p>
        <p className="mt-1.5 text-xs text-ink/70">
          of {wards.length} spent more than budget: {codes(over)}
        </p>
      </Kpi>

      <Kpi
        label={`Wards under ${UNDER_PCT}% used`}
        className="order-4 border-t-[6px] border-t-road lg:order-none"
      >
        <p className={`${BIG} text-4xl`}>
          <span aria-hidden="true" className="mr-1 text-2xl">
            ▼
          </span>
          {under.length}
        </p>
        <p className="mt-1.5 text-xs text-ink/70">
          of {wards.length} used under {UNDER_PCT}% of budget: {codes(under)}
        </p>
      </Kpi>
    </div>
  );
}

/* ---------- ward table ---------- */

type WardKey =
  | "ward_code"
  | "budget_inr"
  | "spend_inr"
  | "utilisation_pct"
  | "flagged_excess_inr"
  | "failed_fix_spend_inr"
  | "low_lying_index";

const COLS: { key: WardKey; label: string; num: boolean }[] = [
  { key: "ward_code", label: "Ward", num: false },
  { key: "budget_inr", label: "Budget", num: true },
  { key: "spend_inr", label: "Spent", num: true },
  { key: "utilisation_pct", label: "Utilisation", num: false },
  { key: "flagged_excess_inr", label: "Flagged ₹", num: true },
  { key: "failed_fix_spend_inr", label: "Failed-fix ₹", num: true },
  { key: "low_lying_index", label: "Low-lying index", num: true },
];

/** Bars run 0–125% so a ward at 119% still fits; the tick marks 100%. */
const UTIL_DOMAIN = 125;

function UtilBar({ value }: { value: number }) {
  const over = value > 100;
  const under = value < UNDER_PCT;
  return (
    <div className="min-w-[10.5rem]">
      <div className="flex items-center gap-2">
        <div
          aria-hidden="true"
          className="relative h-3 w-24 shrink-0 border border-ink bg-paper"
        >
          <div
            className={`h-full ${over ? "bg-stamp" : under ? "bg-road" : "bg-ink"}`}
            style={{ width: `${Math.min(UTIL_DOMAIN, value) / UTIL_DOMAIN * 100}%` }}
          />
          <div
            className="absolute inset-y-[-3px] w-0.5 bg-ink"
            style={{ left: `${(100 / UTIL_DOMAIN) * 100}%` }}
          />
        </div>
        <span
          className={`font-serif text-base font-bold tabular-nums ${over ? "text-stamp" : "text-ink"}`}
        >
          {pct(value)}
        </span>
      </div>
      {over && (
        <p className="mt-0.5 text-xs font-semibold text-stamp">
          <span aria-hidden="true">▲ </span>over budget
        </p>
      )}
      {under && (
        <p className="mt-0.5 text-xs text-ink/75">
          <span aria-hidden="true">▼ </span>under {UNDER_PCT}%
        </p>
      )}
    </div>
  );
}

function WardTable({ wards }: { wards: Ward[] }) {
  const router = useRouter();
  const [sort, setSort] = useState<{ key: WardKey; dir: "asc" | "desc" }>({
    key: "utilisation_pct",
    dir: "desc",
  });

  const rows = useMemo(() => {
    const sign = sort.dir === "asc" ? 1 : -1;
    return [...wards].sort((a, b) => {
      const d =
        sort.key === "ward_code"
          ? a.ward_code.localeCompare(b.ward_code)
          : a[sort.key] - b[sort.key];
      return d * sign || a.ward_code.localeCompare(b.ward_code);
    });
  }, [wards, sort]);

  const total = useMemo(() => {
    const sum = (k: "budget_inr" | "spend_inr" | "flagged_excess_inr" | "failed_fix_spend_inr") =>
      wards.reduce((s, w) => s + w[k], 0);
    return {
      budget: sum("budget_inr"),
      spend: sum("spend_inr"),
      flagged: sum("flagged_excess_inr"),
      failed: sum("failed_fix_spend_inr"),
    };
  }, [wards]);

  function toggle(key: WardKey, num: boolean) {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: num || key === "utilisation_pct" ? "desc" : "asc" },
    );
  }

  const td = "px-3 py-2 align-middle";
  const money = `${td} whitespace-nowrap text-right font-serif text-base font-bold tabular-nums text-ink`;

  return (
    <Scroller label="Ward table. Scroll sideways to see all columns.">
      <table className="w-full min-w-[56rem] border-collapse text-sm">
        <caption className="sr-only">
          Ward budgets and flagged money, one row per ward. Column headings sort
          the table. Select a ward code to open that ward in the Ward officer
          view.
        </caption>
        <thead>
          <tr className="border-b-2 border-ink bg-paper">
            {COLS.map((c, i) => {
              const active = sort.key === c.key;
              return (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={
                    active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"
                  }
                  className={`p-0 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ink/85 ${
                    c.num ? "text-right" : "text-left"
                  } ${i === 0 ? "sticky left-0 z-10 bg-paper" : ""}`}
                >
                  <button
                    onClick={() => toggle(c.key, c.num)}
                    className={`inline-flex min-h-11 w-full items-center gap-1 px-3 uppercase hover:bg-road/20 ${
                      c.num ? "justify-end" : "justify-start"
                    }`}
                  >
                    {c.label}
                    <span aria-hidden="true" className="w-3 text-xs">
                      {active ? (sort.dir === "asc" ? "↑" : "↓") : ""}
                    </span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((w) => (
            <tr
              key={w.ward_code}
              onClick={() => router.push(wardHref(w.ward_code))}
              className="cursor-pointer border-b border-ink/20 hover:bg-road/15 focus-within:bg-road/15"
            >
              <th
                scope="row"
                className="sticky left-0 z-10 border-r border-ink/15 bg-paper p-0 text-left font-normal"
              >
                <Link
                  href={wardHref(w.ward_code)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex min-h-11 flex-col justify-center px-3 py-1"
                >
                  <span className="font-sans text-lg font-bold leading-none text-ink underline underline-offset-4">
                    {w.ward_code}
                  </span>
                  <span className="mt-0.5 block max-w-[9.5rem] truncate text-xs text-ink/70">
                    {w.ward_name}
                  </span>
                  <span className="sr-only">: open in Ward officer view</span>
                </Link>
              </th>
              <td className={money}>{inrShort(w.budget_inr)}</td>
              <td className={money}>{inrShort(w.spend_inr)}</td>
              <td className={td}>
                <UtilBar value={w.utilisation_pct} />
              </td>
              <td className={money}>
                {inrShort(w.flagged_excess_inr)}
              </td>
              <td className={money}>{inrShort(w.failed_fix_spend_inr)}</td>
              <td className={`${td} text-right tabular-nums text-ink`}>
                {w.low_lying_index.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-4 border-double border-ink">
            <th
              scope="row"
              className="sticky left-0 z-10 bg-paper px-3 py-2 text-left text-[0.7rem] font-semibold uppercase tracking-[0.12em]"
            >
              All {wards.length} wards
            </th>
            <td className={money}>{inrShort(total.budget)}</td>
            <td className={money}>{inrShort(total.spend)}</td>
            <td className={`${td} font-serif text-base font-bold tabular-nums`}>
              {pct((total.spend / total.budget) * 100)}
            </td>
            <td className={money}>{inrShort(total.flagged)}</td>
            <td className={money}>{inrShort(total.failed)}</td>
            <td className={td} />
          </tr>
        </tfoot>
      </table>
    </Scroller>
  );
}

/* ---------- reallocation callout ---------- */

function WardLine({ w, kind }: { w: Ward; kind: "over" | "under" }) {
  const amount = Math.abs(w.remaining_inr);
  return (
    <li className="flex items-baseline justify-between gap-3 border-b border-ink/20 py-2 last:border-b-0">
      <span className="min-w-0">
        <Link
          href={wardHref(w.ward_code)}
          className="inline-flex min-h-11 items-center font-sans text-lg font-bold text-ink underline underline-offset-4"
        >
          {w.ward_code}
          <span className="sr-only">: open in Ward officer view</span>
        </Link>
        <span className="ml-2 text-xs text-ink/70">
          {pct(w.utilisation_pct)} of budget
        </span>
      </span>
      <span
        className={`shrink-0 font-serif text-xl font-bold tabular-nums ${kind === "over" ? "text-stamp" : "text-ink"}`}
      >
        {kind === "over" && <span aria-hidden="true">▲ </span>}
        {inrShort(amount)}
        <span className="ml-1 font-sans text-xs font-normal text-ink/75">
          {kind === "over" ? "over budget" : "unspent"}
        </span>
      </span>
    </li>
  );
}

function Reallocation({ wards }: { wards: Ward[] }) {
  const { over, under, overSum, underSum } = useMemo(() => {
    const byUtil = [...wards].sort((a, b) => b.utilisation_pct - a.utilisation_pct);
    const over = byUtil.filter((w) => w.utilisation_pct > 100).slice(0, 3);
    const under = byUtil.filter((w) => w.utilisation_pct <= 100).slice(-3).reverse();
    return {
      over,
      under,
      overSum: over.reduce((s, w) => s - w.remaining_inr, 0),
      underSum: under.reduce((s, w) => s + w.remaining_inr, 0),
    };
  }, [wards]);

  if (!over.length || !under.length) return null;
  const codes = (l: Ward[]) => l.map((w) => w.ward_code).join(", ");

  return (
    <aside
      aria-labelledby="realloc-h"
      className="mt-6 border-2 border-ink p-4 sm:p-5"
    >
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink/70">
        Suggestion for review
      </p>
      <h3
        id="realloc-h"
        className="mt-1 font-sans text-xl font-bold leading-snug text-ink sm:text-2xl"
      >
        Consider reviewing a reallocation from{" "}
        <span className="whitespace-nowrap">{codes(under)}</span>{" "}
        <span aria-hidden="true">→</span>
        <span className="sr-only">to</span>{" "}
        <span className="whitespace-nowrap text-stamp">{codes(over)}</span>
      </h3>
      <div className="mt-3 grid gap-x-8 gap-y-4 md:grid-cols-2">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/75">
            Most over budget ({inrShort(overSum)} in total)
          </h4>
          <ul>
            {over.map((w) => (
              <WardLine key={w.ward_code} w={w} kind="over" />
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/75">
            Least used ({inrShort(underSum)} unspent in total)
          </h4>
          <ul>
            {under.map((w) => (
              <WardLine key={w.ward_code} w={w} kind="under" />
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-3 text-sm text-ink/85">
        {underSum >= overSum
          ? `The unspent budget in ${codes(under)} (${inrShort(underSum)}) is larger than the overspend in ${codes(over)} (${inrShort(overSum)}).`
          : `The unspent budget in ${codes(under)} (${inrShort(underSum)}) is smaller than the overspend in ${codes(over)} (${inrShort(overSum)}).`}{" "}
        This is a prompt for review, not a decision: the data does not show
        which unspent money is already committed.
      </p>
    </aside>
  );
}

/* ---------- contractor scorecard ---------- */

type Explained = {
  id: string;
  name: string;
  text: string;
  fallback: boolean;
};

function scorecardNote(c: Contractor, ratio: number): string {
  const name = cleanName(c.name);
  const head = `${name} had ${c.jobs} jobs billed at ${inr(c.billed_inr)}. ${pct(c.reopen_pct)} of its repairs re-opened, against ${pct(c.expected_reopen_pct_for_method_mix)} expected for its mix of repair methods (${ratio.toFixed(2)} times).`;
  const tail =
    ratio > REOPEN_FLAG_RATIO
      ? ` That is above ${REOPEN_FLAG_RATIO} times expected, so it needs review.`
      : " That is not above the review threshold.";
  return `${head}${tail} ${flagTotal(c)} flags cover ${inr(c.flagged_excess_inr)}.`;
}

function Scorecard({
  contractors,
  context,
}: {
  contractors: Contractor[];
  context: Contractors["context_check"];
}) {
  // One explanation open at a time; results are kept so re-opening is instant.
  const [openId, setOpenId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, Explained>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      [...contractors]
        .map((c) => ({ c, ratio: ratioOf(c) }))
        .sort((a, b) => b.ratio - a.ratio),
    [contractors],
  );

  async function load(c: Contractor, ratio: number) {
    setBusy(c.contractor_id);
    const note = scorecardNote(c, ratio);
    let out: Explained = {
      id: c.contractor_id,
      name: cleanName(c.name),
      text: note,
      fallback: true,
    };
    try {
      const r = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "scorecard",
          record: {
            ...c,
            name: cleanName(c.name),
            reopen_vs_expected_ratio: Number(ratio.toFixed(2)),
            needs_review_if_ratio_above: REOPEN_FLAG_RATIO,
            citywide_reopen_context: context,
            note,
          },
        }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      if (j.text) out = { ...out, text: j.text, fallback: !!j.fallback };
    } catch {
      /* the demo must never break: keep the summary built from the data */
    }
    setResults((m) => ({ ...m, [c.contractor_id]: out }));
    setBusy((b) => (b === c.contractor_id ? null : b));
  }

  function toggle(c: Contractor, ratio: number) {
    const id = c.contractor_id;
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    if (!results[id] && busy !== id) void load(c, ratio);
  }

  const SCORECARD_COLS = 9; // keep equal to the number of <th> in the header
  const td = "px-3 py-3 align-middle";
  const num = `${td} whitespace-nowrap text-right font-serif text-base font-bold tabular-nums text-ink`;
  const th =
    "px-3 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ink/85";

  return (
    <div>
      <Scroller label="Contractor scorecard. Scroll sideways to see all columns.">
        <table className="w-full min-w-[56rem] border-collapse text-sm">
          <caption className="sr-only">
            Contractor scorecard, 8 contractors, highest re-open rate compared
            with expected first. A contractor needs review when its re-open rate
            is above {REOPEN_FLAG_RATIO} times the rate expected for its repair
            methods.
          </caption>
          <thead>
            <tr className="border-b-2 border-ink">
              <th scope="col" className={`${th} sticky left-0 z-10 bg-paper text-left`}>
                Contractor
              </th>
              <th scope="col" className={`${th} text-right`}>Jobs</th>
              <th scope="col" className={`${th} text-right`}>Billed</th>
              <th scope="col" className={`${th} text-right`}>SLA met</th>
              <th scope="col" className={`${th} text-left`}>Re-open vs expected</th>
              <th scope="col" className={`${th} text-right`}>Median cost ratio</th>
              <th scope="col" className={`${th} text-right`}>Flags</th>
              <th scope="col" className={`${th} text-right`}>Flagged ₹</th>
              <th scope="col" className={th}>
                <span className="sr-only">Explain</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ c, ratio }) => {
              const flagged = ratio > REOPEN_FLAG_RATIO;
              const id = c.contractor_id;
              const isOpen = openId === id;
              const res = results[id];
              return (
                <Fragment key={id}>
                <tr className={isOpen ? "" : "border-b border-ink/20"}>
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-r border-ink/15 bg-paper px-3 py-2 text-left font-semibold text-ink"
                  >
                    <span className="block max-w-[10rem] leading-tight">
                      {cleanName(c.name)}
                    </span>
                  </th>
                  <td className={num}>{c.jobs}</td>
                  <td className={num}>{inrShort(c.billed_inr)}</td>
                  <td className={num}>{pct(c.sla_met_pct)}</td>
                  <td className={td}>
                    <p
                      className={`font-serif text-base font-bold tabular-nums ${flagged ? "text-stamp" : "text-ink"}`}
                    >
                      {pct(c.reopen_pct)}{" "}
                      <span className="whitespace-nowrap font-sans text-xs font-normal text-ink/80">
                        vs {pct(c.expected_reopen_pct_for_method_mix)} expected
                      </span>
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs tabular-nums ${flagged ? "font-semibold text-stamp" : "text-ink/75"}`}
                      >
                        <span aria-hidden="true">{flagged ? "▲ " : ratio < 1 ? "▼ " : ""}</span>
                        {ratio.toFixed(2)}× expected
                      </span>
                      {flagged && <Stamp kind="review" small />}
                    </div>
                  </td>
                  <td className={num}>{c.median_cost_ratio.toFixed(2)}×</td>
                  <td className={num}>{flagTotal(c)}</td>
                  <td className={num}>{inrShort(c.flagged_excess_inr)}</td>
                  <td className={`${td} pr-4`}>
                    <button
                      type="button"
                      onClick={() => toggle(c, ratio)}
                      aria-expanded={isOpen}
                      aria-controls={`explain-${id}`}
                      aria-label={`Explain scorecard for ${cleanName(c.name)}`}
                      className={`min-h-11 min-w-[5.5rem] border border-ink px-3 text-sm font-semibold ${
                        isOpen ? "bg-paper text-ink hover:bg-road/25" : "bg-ink text-paper hover:bg-ink/90"
                      }`}
                    >
                      {isOpen ? "Hide" : "Explain"}
                    </button>
                  </td>
                </tr>
                {isOpen && (
                  <tr className="border-b border-ink/20">
                    <td colSpan={SCORECARD_COLS} className="p-0">
                      {/* Stays in view while the wide table scrolls sideways. */}
                      <div
                        id={`explain-${id}`}
                        role="region"
                        aria-label={`Explanation for ${cleanName(c.name)}`}
                        aria-live="polite"
                        className="sticky left-0 my-2 ml-3 max-w-[min(80ch,calc(100vw-2rem))] border-l-4 border-road py-1 pl-4 pr-3"
                      >
                        {res ? (
                          <>
                            <p className="text-sm leading-relaxed text-ink">{res.text}</p>
                            {res.fallback && (
                              <p className="mt-1 text-xs text-ink/70">
                                Showing a summary built from the data (AI explanation
                                unavailable).
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-ink/80">Explaining…</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </Scroller>
      <p className="mt-2 text-xs text-ink/75">
        “Expected” is the re-open rate predicted from each contractor’s mix of
        repair methods. Cost ratio is billed ÷ rate card. A contractor is marked
        for review above {REOPEN_FLAG_RATIO}× expected. Flags can overlap on one
        work order.
      </p>
    </div>
  );
}

/* ---------- fairness check ---------- */

const BAR_MAX = 40; // both charts share one 0–40% scale, so they compare fairly

const BAND_LABEL: Record<string, string> = {
  "(0.0, 0.5]": "Low-lying index 0–0.5",
  "(0.5, 0.7]": "Low-lying index 0.5–0.7",
  "(0.7, 1.0]": "Low-lying index 0.7–1.0",
};

function BarPairs({
  title,
  rows,
  all,
}: {
  title: string;
  rows: { label: string; value: number }[];
  all: number;
}) {
  const id = title.replace(/\W+/g, "-").toLowerCase();
  const values = rows.map((r) => r.value);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  return (
    <figure aria-labelledby={id}>
      <figcaption id={id} className="text-sm font-semibold text-ink">
        {title}
      </figcaption>
      <ul className="mt-2 space-y-2.5">
        {rows.map((r) => (
          <li key={r.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-ink">{r.label}</span>
              <span className="font-serif text-base font-bold tabular-nums text-ink">
                {pct(r.value)}
                <span className="ml-1.5 font-sans text-xs font-normal text-ink/75">
                  ({r.value - all >= 0 ? "+" : "−"}
                  {Math.abs(r.value - all).toFixed(1)} pts)
                </span>
              </span>
            </div>
            <div aria-hidden="true" className="mt-1 space-y-0.5">
              <div className="h-2.5 border border-ink bg-paper">
                <div
                  className="h-full bg-ink"
                  style={{ width: `${(r.value / BAR_MAX) * 100}%` }}
                />
              </div>
              <div className="h-1.5 border border-ink bg-paper">
                <div
                  className="h-full bg-road"
                  style={{ width: `${(all / BAR_MAX) * 100}%` }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-ink/75">
        Text version: re-open rates run from {pct(lo)} to {pct(hi)}, a{" "}
        {(hi - lo).toFixed(1)}-point spread; all jobs average {pct(all)}.
      </p>
    </figure>
  );
}

function Fairness({
  context,
  contractors,
}: {
  context: Contractors["context_check"];
  contractors: Contractor[];
}) {
  const jobs = contractors.reduce((s, c) => s + c.jobs, 0);
  const all = contractors.reduce((s, c) => s + c.jobs * c.reopen_pct, 0) / jobs;

  const rain = context.reopen_by_rain_quartile_pct.map((v, i, a) => ({
    label:
      i === 0
        ? "Rain Q1 · least"
        : i === a.length - 1
          ? `Rain Q${i + 1} · most`
          : `Rain Q${i + 1}`,
    value: v,
  }));
  const bands = Object.entries(context.reopen_by_low_lying_band_pct).map(
    ([k, v]) => ({ label: BAND_LABEL[k] ?? k, value: v }),
  );
  const spread = (xs: { value: number }[]) =>
    Math.max(...xs.map((x) => x.value)) - Math.min(...xs.map((x) => x.value));
  const cRates = contractors.map((c) => c.reopen_pct);
  const cSpread = Math.max(...cRates) - Math.min(...cRates);
  const flat = spread(rain) <= FLAT_SPREAD_PTS && spread(bands) <= FLAT_SPREAD_PTS;

  return (
    <aside
      aria-labelledby="fair-h"
      className="border-2 border-ink p-4 sm:p-5"
    >
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink/70">
        Fairness check
      </p>
      <h3
        id="fair-h"
        className="mt-1 font-sans text-xl font-bold leading-snug text-ink"
      >
        Does rain or flooding explain re-opens?
      </h3>

      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/80">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-2.5 w-5 border border-ink bg-ink" />
          This group
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-2.5 w-5 border border-ink bg-road" />
          All jobs ({pct(all)})
        </span>
      </p>

      <div className="mt-4 space-y-6">
        <BarPairs title="Re-open % by rain quartile" rows={rain} all={all} />
        <BarPairs title="Re-open % by low-lying band" rows={bands} all={all} />
      </div>

      <dl className="mt-5 border-t border-ink/30 pt-3 text-sm">
        <div className="flex justify-between gap-3 py-0.5">
          <dt>Across rain quartiles</dt>
          <dd className="font-serif font-bold tabular-nums">{spread(rain).toFixed(1)} pts</dd>
        </div>
        <div className="flex justify-between gap-3 py-0.5">
          <dt>Across low-lying bands</dt>
          <dd className="font-serif font-bold tabular-nums">{spread(bands).toFixed(1)} pts</dd>
        </div>
        <div className="flex justify-between gap-3 py-0.5">
          <dt>Across contractors</dt>
          <dd className="font-serif font-bold tabular-nums text-stamp">{cSpread.toFixed(1)} pts</dd>
        </div>
      </dl>

      <p className="mt-3 border-l-4 border-road pl-3 text-sm font-semibold text-ink">
        {flat
          ? "Re-open differences are not explained by heavy rain or flood-prone wards."
          : "Re-open rates differ by rain or by flood-prone band here, so read the contractor gaps with care."}
      </p>
    </aside>
  );
}

/* ---------- actions taken (read from the ward office's saved statuses) ---------- */

const ACTION_ROWS: { status: Status; label: string }[] = [
  { status: "review", label: "Under review" },
  { status: "contested", label: "Contested" },
  { status: "recovered", label: "Recovered" },
  { status: "dismissed", label: "Dismissed" },
];

function ActionsTaken() {
  const statuses = useStatuses();
  const followUps = useFollowUps();
  const flags = useData<Flag[]>("flags.json");
  const rows = useMemo(() => statusRows(statuses), [statuses]);
  const count = (st: Status) => rows.filter((r) => r.status === st).length;
  // A saved status is keyed "work order|flag type"; ₹ comes from that flag's excess.
  const recovered = useMemo(() => {
    if (!flags.data) return null;
    const excess = new Map(flags.data.map((f) => [`${f.work_order_id}|${f.flag}`, f.excess_inr]));
    return rows
      .filter((r) => r.status === "recovered")
      .reduce((sum, r) => sum + (excess.get(r.key) ?? 0), 0);
  }, [rows, flags.data]);

  return (
    <section aria-labelledby="actions-h" className="mt-8 border border-ink/40 bg-paper p-3 sm:p-4">
      <h2 id="actions-h" className="font-sans text-2xl font-bold text-ink">
        Actions taken
      </h2>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
        {ACTION_ROWS.map((a) => (
          <div key={a.status}>
            <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink/70">
              {a.label}
            </dt>
            <dd className={`${BIG} text-3xl`}>{count(a.status)}</dd>
          </div>
        ))}
        <div>
          <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink/70">
            ₹ recovered
          </dt>
          <dd className={`${BIG} text-3xl`}>{recovered == null ? "…" : inr(recovered)}</dd>
        </div>
        <div>
          <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink/70">
            Citizen follow-ups
          </dt>
          <dd className={`${BIG} text-3xl`}>{followUps.length}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-ink/70">
        Counts are per flag, as the ward office saves them. {DICT.demoNote.en}
      </p>
    </section>
  );
}

/* ---------- view ---------- */

export default function CommissionerView() {
  const wards = useData<Ward[]>("wards.json");
  const summary = useData<Summary>("summary.json");
  const cons = useData<Contractors>("contractors.json");

  const shell = "mx-auto max-w-7xl px-4 py-6 focus:outline-none";
  const error = wards.error || summary.error || cons.error;
  if (error)
    return (
      <main id="main" tabIndex={-1} lang="en" className={shell}>
        <p className="border-2 border-stamp p-4 text-sm font-semibold text-stamp">
          Couldn’t load the data: {error}
        </p>
      </main>
    );
  if (!wards.data || !summary.data || !cons.data)
    return (
      <main id="main" tabIndex={-1} lang="en" className={shell}>
        <p className="text-sm text-ink/70">Loading city data…</p>
      </main>
    );

  const w = wards.data;
  const over = w
    .filter((x) => x.utilisation_pct > 100)
    .sort((a, b) => b.utilisation_pct - a.utilisation_pct);
  const under = w
    .filter((x) => x.utilisation_pct < UNDER_PCT)
    .sort((a, b) => a.utilisation_pct - b.utilisation_pct);
  const worst = [...cons.data.contractors].sort(
    (a, b) => b.reopen_pct - a.reopen_pct || ratioOf(b) - ratioOf(a),
  )[0];

  return (
    <main id="main" tabIndex={-1} lang="en" className={shell}>
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ink/70">
        Commissioner view
      </p>
      <h1 className="font-sans text-4xl font-bold leading-tight text-ink">
        Mumbai, citywide
      </h1>

      <Headline summary={summary.data} overspent={over.length} worst={worst} />
      <KpiRow summary={summary.data} wards={w} over={over} under={under} />
      <ActionsTaken />

      <div className="mt-8">
        <Section
          title="Ward budgets"
          note="Select a ward to open it in the Ward officer view."
        >
          <WardTable wards={w} />
          <Reallocation wards={w} />
        </Section>
      </div>

      <div className="mt-10">
        <Section
          title="Contractor scorecard"
          note="Who re-opens more than their repair methods predict, and who has the most flagged money."
        >
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_21rem] xl:items-start">
            <Scorecard
              contractors={cons.data.contractors}
              context={cons.data.context_check}
            />
            <Fairness
              context={cons.data.context_check}
              contractors={cons.data.contractors}
            />
          </div>
        </Section>
      </div>
    </main>
  );
}
