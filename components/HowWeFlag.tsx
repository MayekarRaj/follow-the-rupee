"use client";

import { useData, type Contractors, type Robustness, type Summary } from "@/lib/data";
import { NORMAL_RANGE, WATCH_RANGE } from "@/lib/flagInfo";
import { usePrefs } from "@/lib/prefs";
import Drawer from "./Drawer";

function band(k: string): string {
  const m = k.match(/\(([\d.]+),\s*([\d.]+)\]/);
  return m ? `${m[1]}–${m[2]}` : k;
}

function Bars({ rows, unit }: { rows: { label: string; v: number }[]; unit: string }) {
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex justify-between text-sm">
            <span>{r.label}</span>
            <span className="font-serif font-bold tabular-nums">
              {r.v.toFixed(1)}
              {unit}
            </span>
          </div>
          <div className="mt-0.5 h-2.5 border border-ink" aria-hidden="true">
            <div className="h-full bg-ink" style={{ width: `${Math.min(100, (r.v / 40) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-6 border-b border-ink font-sans text-lg font-bold text-ink">
      {children}
    </h3>
  );
}


const ROAD_ORDER = ["Highway", "Arterial", "Main", "Local"];

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      scope="col"
      className={`border-b border-ink px-2 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink/70 ${right ? "text-right" : "text-left"}`}
    >
      {children}
    </th>
  );
}

function Td({ children, right, bold }: { children: React.ReactNode; right?: boolean; bold?: boolean }) {
  return (
    <td
      className={`border-b border-dotted border-ink/40 px-2 py-1.5 tabular-nums ${right ? "text-right" : ""} ${bold ? "font-serif text-base font-bold" : ""}`}
    >
      {children}
    </td>
  );
}

function range(vals: number[]): string {
  return `${Math.min(...vals).toFixed(1)}–${Math.max(...vals).toFixed(1)}%`;
}

function RobustnessChecks({
  r,
  currentRatio,
  dlpPaidTotal,
}: {
  r: Robustness;
  currentRatio: number;
  dlpPaidTotal?: number;
}) {
  const thresholds = Object.entries(r.overbill_count_by_threshold);
  const mixes = Object.values(r.contractor_road_type_mix_pct);
  const roadTypes = ROAD_ORDER.filter((k) => k in r.reopen_pct_by_road_type);
  const dup = r.duplicate_count;
  return (
    <>
      <p className="mt-2 text-xs text-ink/80">
        We re-ran each rule with different settings to see whether the flags are
        an accident of one chosen number.
      </p>

      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-ink/70">
        Over-billing: how many bills are flagged at each threshold
      </p>
      <table className="mt-1 w-full border-collapse text-sm">
        <caption className="sr-only">
          Number of work orders billed at or above each multiple of the rate card
        </caption>
        <thead>
          <tr>
            <Th>Flag at</Th>
            <Th right>Bills flagged</Th>
          </tr>
        </thead>
        <tbody>
          {thresholds.map(([k, n]) => {
            const current = k === `${currentRatio.toFixed(2)}x`;
            return (
              <tr key={k} className={current ? "bg-road/20 font-semibold" : ""}>
                <Td>
                  {k.replace("x", "×")}
                  {current && <span className="font-sans text-xs"> · rule used</span>}
                </Td>
                <Td right bold>
                  {n}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-ink/70">
        Paid twice?: does a wider rule find more?
      </p>
      <table className="mt-1 w-full border-collapse text-sm">
        <caption className="sr-only">Duplicate-bill count under three versions of the rule</caption>
        <thead>
          <tr>
            <Th>Rule version</Th>
            <Th right>Flagged</Th>
          </tr>
        </thead>
        <tbody>
          <tr className="bg-road/20 font-semibold">
            <Td>Rule used: within 10 days, cost within 10%</Td>
            <Td right bold>{dup["10d_10pct"]}</Td>
          </tr>
          <tr>
            <Td>Widened: within 30 days, cost within 25%</Td>
            <Td right bold>{dup["30d_25pct"]}</Td>
          </tr>
          <tr>
            <Td>Widened, and also counting jobs with a linked complaint</Td>
            <Td right bold>{dup["30d_25pct_incl_linked"]}</Td>
          </tr>
        </tbody>
      </table>
      <p className="mt-1 text-xs text-ink/80">
        Work orders with no linked complaint, in the whole dataset:{" "}
        <strong className="tabular-nums">{r.unlinked_work_orders_total}</strong>.
      </p>

      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-ink/70">
        Re-open rate by road type
      </p>
      <table className="mt-1 w-full border-collapse text-sm">
        <caption className="sr-only">
          Share of repairs re-opened, by road type, and the share of each contractor’s jobs on that road type
        </caption>
        <thead>
          <tr>
            <Th>Road type</Th>
            <Th right>Re-opened</Th>
            <Th right>Share of a contractor’s jobs</Th>
          </tr>
        </thead>
        <tbody>
          {roadTypes.map((k) => (
            <tr key={k}>
              <Td>{k}</Td>
              <Td right bold>{r.reopen_pct_by_road_type[k].toFixed(1)}%</Td>
              <Td right>{range(mixes.map((m) => m[k]).filter((v) => v != null))}</Td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 border-l-4 border-road bg-road/20 p-2 font-semibold">
        Every contractor gets a similar road-type mix.
      </p>
      <p className="mt-1 text-xs text-ink/80">
        The last column is the lowest and highest share across the{" "}
        {mixes.length} contractors.
      </p>

      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-ink/70">
        Warranty flags with a possible other cause
      </p>
      <p className="mt-1">
        <strong className="font-serif text-xl tabular-nums">
          {r.dlp_paid_with_utility_remark}
        </strong>
        {dlpPaidTotal ? (
          <span className="tabular-nums"> of {dlpPaidTotal}</span>
        ) : null}{" "}
        paid-during-warranty flags carry an engineer remark about a utility
        (MTNL/MGL) trench.
      </p>

      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-ink/70">
        In plain words
      </p>
      <ul className="mt-1 list-disc space-y-1 pl-5">
        {r.notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </>
  );
}

export default function HowWeFlag({ onClose }: { onClose: () => void }) {
  const { t, dataLang } = usePrefs();
  const summary = useData<Summary>("summary.json");
  const contractors = useData<Contractors>("contractors.json");
  const th = summary.data?.thresholds;
  const cc = contractors.data?.context_check;
  const rob = summary.data?.robustness;

  const rain = cc?.reopen_by_rain_quartile_pct ?? [];
  const lowLying = Object.entries(cc?.reopen_by_low_lying_band_pct ?? {});
  const all = [...rain, ...lowLying.map(([, v]) => v)];

  return (
    <Drawer label={t("how.title")} onClose={onClose}>
      <h2 className="font-sans text-2xl font-bold leading-tight text-ink">
        {t("how.title")}
      </h2>
      <p className="mt-2 border-l-4 border-road bg-road/20 p-3 text-sm font-semibold text-ink">
        {t("oneLine")}
      </p>

      <div lang={dataLang} className="text-sm text-ink">
        <H>{t("how.over")}</H>
        <p className="mt-2">
          A bill is flagged when it is{" "}
          <strong className="font-serif tabular-nums">
            {th ? `${th.overbill_ratio}×` : "1.5×"}
          </strong>{" "}
          the rate card or more. Normal jobs bill{" "}
          <strong className="tabular-nums">{NORMAL_RANGE}</strong> of the rate
          card. Bills between <span className="tabular-nums">{WATCH_RANGE}</span>{" "}
          go on a watch list and are not flagged.
        </p>

        <H>{t("how.dup")}</H>
        <p className="mt-2">
          Same road, method, contractor and area billed again within{" "}
          <strong className="tabular-nums">
            {th ? th.dup_window_days : 10} days
          </strong>{" "}
          of an earlier bill, with no citizen complaint linked.
        </p>

        <H>{t("how.dlp")}</H>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong>Paid during warranty:</strong> road-surface work (
            {(th?.surface_work_types ?? []).join(", ") || "…"}) on a road still
            inside its Defect Liability Period (DLP). The original contractor
            should fix it free.
          </li>
          <li>
            <strong>Check: drainage on a warranty road:</strong> drainage or
            utility work on a DLP road. Usually not a pavement defect, but worth
            checking whether the resurfacing caused it.
          </li>
        </ul>

        <H>{t("how.fair")}</H>
        {cc ? (
          <>
            <p className="mt-2 text-xs text-ink/80">
              Re-open rate by rain quartile (
              {Math.min(...rain).toFixed(1)}–{Math.max(...rain).toFixed(1)}%) and
              by low-lying band (
              {Math.min(...lowLying.map(([, v]) => v)).toFixed(1)}–
              {Math.max(...lowLying.map(([, v]) => v)).toFixed(1)}%).
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink/70">
              Rain quartile
            </p>
            <Bars
              unit="%"
              rows={rain.map((v, i) => ({ label: `Q${i + 1}`, v }))}
            />
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink/70">
              Low-lying index
            </p>
            <Bars
              unit="%"
              rows={lowLying.map(([k, v]) => ({ label: band(k), v }))}
            />
            <span className="sr-only">
              Highest value {Math.max(...all).toFixed(1)} percent, lowest{" "}
              {Math.min(...all).toFixed(1)} percent.
            </span>
          </>
        ) : (
          <p className="mt-2 text-ink/70">Loading…</p>
        )}
      </div>
      <p className="mt-3 text-sm font-semibold text-ink">
        {t("how.fairCaption")}
      </p>

      <div lang={dataLang} className="text-sm text-ink">
        <H>{t("how.robust")}</H>
        {rob ? (
          <RobustnessChecks
            r={rob}
            currentRatio={th?.overbill_ratio ?? 1.5}
            dlpPaidTotal={summary.data?.flag_counts?.DLP_PAID}
          />
        ) : (
          <p className="mt-2 text-ink/70">Loading…</p>
        )}
      </div>
    </Drawer>
  );
}
