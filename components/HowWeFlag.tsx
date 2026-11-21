"use client";

import { useData, type Contractors, type Summary } from "@/lib/data";
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
    <h3 className="mt-6 border-b border-ink font-serif text-lg font-bold text-ink">
      {children}
    </h3>
  );
}

export default function HowWeFlag({ onClose }: { onClose: () => void }) {
  const { t, dataLang } = usePrefs();
  const summary = useData<Summary>("summary.json");
  const contractors = useData<Contractors>("contractors.json");
  const th = summary.data?.thresholds;
  const cc = contractors.data?.context_check;

  const rain = cc?.reopen_by_rain_quartile_pct ?? [];
  const lowLying = Object.entries(cc?.reopen_by_low_lying_band_pct ?? {});
  const all = [...rain, ...lowLying.map(([, v]) => v)];

  return (
    <Drawer label={t("how.title")} onClose={onClose}>
      <h2 className="font-serif text-2xl font-bold leading-tight text-ink">
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
    </Drawer>
  );
}
