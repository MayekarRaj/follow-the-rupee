"use client";

import { useMemo, useState } from "react";
import { cleanName, inr, inrShort, pct } from "@/lib/format";
import {
  useData,
  type Flag,
  type FlagType,
  type NextRupee,
  type QueueItem,
  type Ward,
} from "@/lib/data";
import { usePrefs } from "@/lib/prefs";
import { flagKey, statusOf, useStatuses, type StatusMap } from "@/lib/status";
import type { Key } from "@/lib/i18n";
import FlagDrawer from "./FlagDrawer";
import Stamp, { stampFor } from "./Stamp";
import StatusTag from "./StatusTag";

const TAB_ORDER: FlagType[] = [
  "DUPLICATE_BILL",
  "OVERBILLED",
  "DLP_PAID",
  "DLP_REVIEW",
];
const TAB_KEY: Record<FlagType, Key> = {
  DUPLICATE_BILL: "tab.DUPLICATE_BILL",
  OVERBILLED: "tab.OVERBILLED",
  DLP_PAID: "tab.DLP_PAID",
  DLP_REVIEW: "tab.DLP_REVIEW",
};
const COLLAPSED = 5;

/* ---------- headline ---------- */

function Headline({ ward, flags }: { ward: Ward; flags: Flag[] }) {
  const { t } = usePrefs();
  const groups = TAB_ORDER.map((type) => {
    const rows = flags.filter((f) => f.flag === type);
    return {
      type,
      n: rows.length,
      total: rows.reduce((s, r) => s + r.excess_inr, 0),
    };
  });
  const start = groups.find((g) => g.n > 0);
  const workOrders = new Set(flags.map((f) => f.work_order_id)).size;

  if (!start || workOrders === 0)
    return (
      <p className="mt-3 font-serif text-xl text-ink">{t("head.none")}</p>
    );

  const a = t(workOrders === 1 ? "head.a1" : "head.a", {
    amount: inrShort(ward.flagged_excess_inr),
    n: workOrders,
  });
  const y = inrShort(start.total);
  const tail =
    start.type === "DUPLICATE_BILL"
      ? t(start.n === 1 ? "head.twice1" : "head.twice", { k: start.n, y })
      : t("head.other", {
          k: start.n,
          label: t(TAB_KEY[start.type]).toLowerCase(),
          y,
        });
  return (
    <p className="mt-3 max-w-3xl font-serif text-xl font-semibold leading-snug text-ink sm:text-2xl">
      {a} <span className="whitespace-nowrap text-stamp">{t("head.start")}</span>{" "}
      {tail}.
    </p>
  );
}

/* ---------- KPI row ---------- */

function Kpi({
  label,
  value,
  sub,
  className = "",
  children,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`border border-ink/40 bg-paper p-3 sm:p-4 ${className}`}>
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink/70">
        {label}
      </p>
      {value}
      {sub && <p className="mt-0.5 text-xs tabular-nums text-ink/70">{sub}</p>}
      {children}
    </div>
  );
}

function KpiRow({ ward, flagCount }: { ward: Ward; flagCount: number }) {
  const { t } = usePrefs();
  const over = ward.utilisation_pct > 100;
  const fill = Math.min(100, Math.max(0, ward.utilisation_pct));
  const big = "mt-1 font-serif font-bold tabular-nums";

  return (
    <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-[2fr_1fr_1fr_1fr]">
      <Kpi
        label={t("kpi.flagged")}
        className="col-span-2 border-t-[8px] border-t-stamp lg:col-span-1"
        value={
          <p className={`${big} text-5xl text-stamp sm:text-6xl`}>
            {inrShort(ward.flagged_excess_inr)}
          </p>
        }
        sub={t("kpi.flaggedSub", { n: flagCount })}
      >
        <div className="mt-2">
          <Stamp kind="review" small />
        </div>
      </Kpi>

      <Kpi
        label={t("kpi.budget")}
        className="border-t-[6px] border-t-road"
        value={<p className={`${big} text-3xl`}>{inrShort(ward.budget_inr)}</p>}
        sub={inr(ward.budget_inr)}
      />

      <Kpi
        label={t("kpi.spent")}
        className={`border-t-[6px] ${over ? "border-t-stamp" : "border-t-road"}`}
        value={
          <p className={`${big} text-3xl ${over ? "text-stamp" : "text-ink"}`}>
            {inrShort(ward.spend_inr)}
          </p>
        }
      >
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(fill)}
          aria-valuetext={`${pct(ward.utilisation_pct)} of budget spent${over ? ", over budget" : ""}`}
          className="mt-2 h-3 border border-ink bg-paper"
        >
          <div
            className={`h-full ${over ? "bg-stamp" : "bg-ink"}`}
            style={{ width: `${fill}%` }}
          />
        </div>
        <p
          className={`mt-1 text-xs tabular-nums ${over ? "font-semibold text-stamp" : "text-ink/70"}`}
        >
          {over && <span aria-hidden="true">▲ </span>}
          {t("kpi.spentSub", { p: pct(ward.utilisation_pct) })}
          {over && ` (${t("kpi.over")})`}
        </p>
      </Kpi>

      <Kpi
        label={t("kpi.failed")}
        className="border-t-[6px] border-t-road"
        value={
          <p className={`${big} text-3xl`}>{inrShort(ward.failed_fix_spend_inr)}</p>
        }
        sub={t("kpi.failedSub")}
      />
    </div>
  );
}

/* ---------- action queue (tabs) ---------- */

function FlagRow({
  f,
  statuses,
  onOpen,
}: {
  f: Flag;
  statuses: StatusMap;
  onOpen: () => void;
}) {
  const { dataLang } = usePrefs();
  const rec = statusOf(statuses, flagKey(f));
  return (
    <button
      onClick={onOpen}
      className="flex min-h-14 w-full flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-left hover:bg-road/15 focus-visible:bg-road/15 sm:flex-nowrap"
    >
      <Stamp kind={stampFor(f.flag)} small className="order-1 shrink-0" />
      <span className="order-1 sm:order-3 sm:flex sm:w-[7.5rem] sm:justify-end">
        <StatusTag status={rec.status} />
      </span>
      <span className="order-2 ml-auto font-serif text-xl font-bold leading-none tabular-nums text-ink sm:order-4 sm:ml-0 sm:w-24 sm:text-right">
        {inr(f.excess_inr)}
      </span>
      <span
        lang={dataLang}
        className="order-3 w-full min-w-0 sm:order-2 sm:w-auto sm:flex-1"
      >
        <span className="block truncate text-sm font-semibold text-ink">
          <span className="font-mono">{f.work_order_id}</span>
          <span className="font-normal text-ink/70"> · {f.road}</span>
        </span>
        <span className="block truncate text-xs text-ink/70">
          {cleanName(f.contractor)}
        </span>
      </span>
    </button>
  );
}

function FlagTabs({
  flags,
  statuses,
  onOpen,
}: {
  flags: Flag[];
  statuses: StatusMap;
  onOpen: (f: Flag) => void;
}) {
  const { t } = usePrefs();
  const [picked, setPicked] = useState<FlagType | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const groups = useMemo(
    () =>
      TAB_ORDER.map((type) => {
        const rows = flags
          .filter((f) => f.flag === type)
          .sort((a, b) => b.excess_inr - a.excess_inr);
        return {
          type,
          rows,
          total: rows.reduce((s, r) => s + r.excess_inr, 0),
        };
      }),
    [flags],
  );
  const active: FlagType =
    picked ?? groups.find((g) => g.rows.length > 0)?.type ?? "DUPLICATE_BILL";
  const group = groups.find((g) => g.type === active)!;
  const open = !!expanded[active];
  const shown = open ? group.rows : group.rows.slice(0, COLLAPSED);

  function onKey(e: React.KeyboardEvent<HTMLButtonElement>, i: number) {
    let j = i;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") j = (i + 1) % groups.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") j = (i - 1 + groups.length) % groups.length;
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = groups.length - 1;
    else return;
    e.preventDefault();
    setPicked(groups[j].type);
    (e.currentTarget.parentElement?.children[j] as HTMLElement)?.focus();
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label={t("sec.queue")}
        className="grid grid-cols-2 gap-2 xl:grid-cols-4"
      >
        {groups.map((g, i) => {
          const sel = g.type === active;
          return (
            <button
              key={g.type}
              role="tab"
              id={`tab-${g.type}`}
              aria-selected={sel}
              aria-controls="queue-panel"
              tabIndex={sel ? 0 : -1}
              onClick={() => setPicked(g.type)}
              onKeyDown={(e) => onKey(e, i)}
              className={`min-h-11 border p-2 text-left ${
                sel
                  ? "border-ink bg-ink text-paper"
                  : "border-ink/50 bg-paper text-ink hover:bg-road/20"
              }`}
            >
              <span className="block text-xs font-semibold leading-tight">
                {t(TAB_KEY[g.type])}
              </span>
              <span className="mt-1 flex items-baseline gap-1.5">
                <span className="font-serif text-xl font-bold tabular-nums">
                  {g.rows.length}
                </span>
                <span className="font-serif text-sm tabular-nums opacity-90">
                  · {inrShort(g.total)}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="queue-panel"
        aria-labelledby={`tab-${active}`}
        className="mt-3 border border-ink/40"
      >
        {group.rows.length === 0 ? (
          <p className="p-4 text-sm text-ink/80">{t("none")}</p>
        ) : (
          <ul className="divide-y divide-ink/20">
            {shown.map((f) => (
              <li key={`${f.work_order_id}|${f.flag}`}>
                <FlagRow f={f} statuses={statuses} onOpen={() => onOpen(f)} />
              </li>
            ))}
          </ul>
        )}
        {group.rows.length > COLLAPSED && (
          <button
            onClick={() => setExpanded((e) => ({ ...e, [active]: !e[active] }))}
            aria-expanded={open}
            className="min-h-11 w-full border-t border-ink/40 px-4 text-sm font-semibold text-ink underline underline-offset-4 hover:bg-road/15"
          >
            {open ? t("showFewer") : t("showAll", { n: group.rows.length })}
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- right column ---------- */

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
    <section>
      <div className="rule-double mb-3 flex flex-wrap items-baseline justify-between gap-2 pb-1.5">
        <h2 className="font-serif text-2xl font-bold text-ink">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function FundingBadge({ q }: { q: QueueItem }) {
  const { t } = usePrefs();
  if (q.funding.startsWith("Original contractor")) return <Stamp kind="dlp" small />;
  return (
    <span className="inline-flex items-center gap-1.5 border border-ink px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-ink">
      <span aria-hidden="true">₹</span>
      {t("wardBudget")}
    </span>
  );
}

function NextRupeeSection({ data }: { data: NextRupee[string] | undefined }) {
  const { t, dataLang } = usePrefs();
  if (!data) return null;
  const over = data.remaining_budget_inr < 0;
  return (
    <>
      {over && (
        <div
          role="alert"
          className="mb-3 flex gap-2 border-2 border-stamp p-3 text-sm font-semibold text-stamp"
        >
          <span aria-hidden="true">▲</span>
          <span>{t("overspent", { x: inr(-data.remaining_budget_inr) })}</span>
        </div>
      )}
      <ul className="border-t border-ink/40">
        {data.queue.map((q) => (
          <li
            key={q.road_id}
            className={`border-b border-ink/40 px-1 py-3 ${q.fundable_now ? "" : "opacity-60"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div lang={dataLang} className="min-w-0">
                <p className="font-serif text-base font-bold leading-tight text-ink">
                  {q.road_name}
                </p>
                <p className="text-xs text-ink/70">
                  {q.issue} · {q.method}
                </p>
              </div>
              <p className="shrink-0 font-serif text-xl font-bold leading-none tabular-nums text-ink">
                {inr(q.est_cost_inr)}
              </p>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink/70">
                {t("risk")}
              </span>
              <div
                className="h-3 flex-1 border border-ink bg-paper"
                role="img"
                aria-label={`${t("risk")} ${q.risk_score} / 100`}
              >
                <div
                  className="h-full bg-hazard"
                  style={{ width: `${Math.min(100, Math.max(0, q.risk_score))}%` }}
                />
              </div>
              <span className="w-12 text-right font-serif text-base font-bold tabular-nums text-ink">
                {q.risk_score.toFixed(1)}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <FundingBadge q={q} />
              {!q.fundable_now && (
                <span className="text-xs font-medium text-ink/80">
                  {t("noFit")}
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
    <ul className="space-y-3 border border-ink/40 p-3">
      {rows.map(([name, v]) => (
        <li key={name}>
          <div className="flex justify-between gap-3 text-sm">
            <span className="text-ink">{cleanName(name)}</span>
            <span className="font-serif text-base font-bold tabular-nums text-ink">
              {inrShort(v)}
            </span>
          </div>
          <div className="mt-1 h-3 border border-ink bg-paper" aria-hidden="true">
            <div className="h-full bg-ink" style={{ width: `${(v / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---------- view ---------- */

export default function WardView({ wardCode }: { wardCode: string }) {
  const { t } = usePrefs();
  const wards = useData<Ward[]>("wards.json");
  const flags = useData<Flag[]>("flags.json");
  const next = useData<NextRupee>("next_rupee.json");
  const statuses = useStatuses();
  const [selected, setSelected] = useState<Flag | null>(null);

  const error = wards.error || flags.error || next.error;
  const ward = wards.data?.find((w) => w.ward_code === wardCode);
  const wardFlags = useMemo(
    () => (flags.data ?? []).filter((f) => f.ward === wardCode),
    [flags.data, wardCode],
  );

  const shell = "mx-auto max-w-7xl px-4 py-6 focus:outline-none";
  if (error)
    return (
      <main id="main" tabIndex={-1} className={shell}>
        <p className="border-2 border-stamp p-4 text-sm font-semibold text-stamp">
          Couldn’t load the data: {error}
        </p>
      </main>
    );
  if (!wards.data || !flags.data || !next.data)
    return (
      <main id="main" tabIndex={-1} className={shell}>
        <p className="text-sm text-ink/70">{t("loading")}</p>
      </main>
    );
  if (!ward)
    return (
      <main id="main" tabIndex={-1} className={shell}>
        <p className="text-sm text-ink">
          Unknown ward “{wardCode}”. Pick one from the Ward menu.
        </p>
      </main>
    );

  const nr = next.data[wardCode];

  return (
    <main id="main" tabIndex={-1} className={shell}>
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ink/70">
        {t("wardView")}
      </p>
      <h1 className="font-serif text-4xl font-bold leading-tight text-ink">
        {t("ward")} {ward.ward_code}
        <span lang="en" className="block text-xl font-normal text-ink/70 sm:inline sm:text-4xl">
          <span className="hidden sm:inline"> · </span>
          {ward.ward_name}
        </span>
      </h1>

      <Headline ward={ward} flags={wardFlags} />
      <KpiRow ward={ward} flagCount={new Set(wardFlags.map((f) => f.work_order_id)).size} />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <Section title={t("sec.queue")}>
          <FlagTabs
            key={wardCode}
            flags={wardFlags}
            statuses={statuses}
            onOpen={setSelected}
          />
        </Section>

        <div className="space-y-8 lg:sticky lg:top-[calc(var(--header-h,6rem)+1rem)] lg:max-h-[calc(100vh-var(--header-h,6rem)-2rem)] lg:overflow-y-auto lg:pr-1">
          <Section
            title={t("sec.next")}
            right={
              nr && (
                <p
                  className={`text-sm font-semibold ${nr.remaining_budget_inr < 0 ? "text-stamp" : "text-ink"}`}
                >
                  {t("remaining")}{" "}
                  <span className="font-serif text-lg font-bold tabular-nums">
                    {inr(nr.remaining_budget_inr)}
                  </span>
                </p>
              )
            }
          >
            <NextRupeeSection data={nr} />
          </Section>
          <Section title={t("sec.contractors")}>
            <ContractorBars ward={ward} />
          </Section>
        </div>
      </div>

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
