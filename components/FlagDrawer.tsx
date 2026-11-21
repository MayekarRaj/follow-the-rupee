"use client";

import { useState } from "react";
import { cleanName, inr } from "@/lib/format";
import { useData, type Flag, type Summary } from "@/lib/data";
import { NEXT_STEP, whyFlagged } from "@/lib/flagInfo";
import { usePrefs } from "@/lib/prefs";
import {
  flagKey,
  setStatus,
  statusOf,
  useStatuses,
} from "@/lib/status";
import Drawer from "./Drawer";
import Stamp, { stampFor } from "./Stamp";
import StatusTag from "./StatusTag";

function Field({
  k,
  v,
  money = false,
}: {
  k: string;
  v: React.ReactNode;
  money?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-dotted border-ink/40 py-1.5 text-sm">
      <dt className="text-ink/70">{k}</dt>
      <dd
        className={`min-w-0 break-words text-right font-semibold tabular-nums text-ink ${
          money ? "font-serif text-base font-bold" : ""
        }`}
      >
        {v}
      </dd>
    </div>
  );
}

function Part({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 border-t-2 border-ink pt-3">
      <h3 className="flex items-baseline gap-2 font-serif text-lg font-bold text-ink">
        <span
          aria-hidden="true"
          className="inline-flex h-6 w-6 items-center justify-center border border-ink text-xs"
        >
          {n}
        </span>
        {title}
      </h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-ink/40 p-2">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink/70">
        {label}
      </p>
      <p className="font-serif text-xl font-bold tabular-nums text-ink">
        {value}
      </p>
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
  const { t } = usePrefs();
  return (
    <div className="min-w-0 border border-ink/40 p-3">
      <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink/70">
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
          <Field k={t("billed")} v={inr(f.billed_inr)} money />
        </dl>
      ) : (
        <p className="mt-1 text-xs text-ink/70">
          Not in the flagged list (it is the earlier, un-flagged bill).
        </p>
      )}
    </div>
  );
}

function StatusPanel({ flag }: { flag: Flag }) {
  const { t, dataLang } = usePrefs();
  const statuses = useStatuses();
  const key = flagKey(flag);
  const rec = statusOf(statuses, key);
  const [dismissing, setDismissing] = useState(false);
  const [reason, setReason] = useState("");

  const btn =
    "min-h-11 border border-ink px-3 text-sm font-semibold text-ink hover:bg-road/25";
  const primary =
    "min-h-11 border border-ink bg-ink px-3 text-sm font-semibold text-paper hover:bg-ink/90 disabled:opacity-50";

  return (
    <div className="mt-3 border border-ink/40 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/70">
          {t("statusLabel")}
        </span>
        <StatusTag status={rec.status} />
      </div>
      {rec.status === "dismissed" && rec.reason && (
        <p lang={dataLang} className="mt-2 text-sm text-ink">
          <span className="font-semibold">{t("reasonShown")}:</span>{" "}
          {rec.reason}
        </p>
      )}

      {!dismissing && (
        <div className="mt-3 flex flex-wrap gap-2">
          {rec.status === "new" && (
            <button className={primary} onClick={() => setStatus(key, "review")}>
              {t("startReview")}
            </button>
          )}
          {rec.status === "review" && (
            <>
              <button
                className={primary}
                onClick={() => setStatus(key, "recovered")}
              >
                {t("markRecovered")}
              </button>
              <button className={btn} onClick={() => setDismissing(true)}>
                {t("dismiss")}
              </button>
            </>
          )}
          {(rec.status === "recovered" || rec.status === "dismissed") && (
            <button className={btn} onClick={() => setStatus(key, "review")}>
              {t("reopen")}
            </button>
          )}
        </div>
      )}

      {dismissing && (
        <form
          className="mt-3"
          onSubmit={(e) => {
            e.preventDefault();
            const r = reason.trim();
            if (!r) return;
            setStatus(key, "dismissed", r);
            setDismissing(false);
            setReason("");
          }}
        >
          <label className="block text-sm font-semibold text-ink" htmlFor="dismiss-reason">
            {t("dismissReason")}
          </label>
          <textarea
            id="dismiss-reason"
            required
            maxLength={200}
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full border border-ink bg-paper p-2 text-sm text-ink"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="submit" className={primary} disabled={!reason.trim()}>
              {t("confirmDismiss")}
            </button>
            <button
              type="button"
              className={btn}
              onClick={() => {
                setDismissing(false);
                setReason("");
              }}
            >
              {t("cancel")}
            </button>
          </div>
        </form>
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
  const { t, dataLang } = usePrefs();
  const { data: summary } = useData<Summary>("summary.json");
  const statuses = useStatuses();
  const rec = statusOf(statuses, flagKey(flag));
  const [explain, setExplain] = useState<{
    text: string;
    fallback: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);

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
  const why = whyFlagged(flag, summary?.thresholds);
  const next = NEXT_STEP[flag.flag];

  return (
    <Drawer label={`${t(`tab.${flag.flag}`)} · ${flag.work_order_id}`} onClose={onClose}>
      <div className="mb-2 pl-1">
        <Stamp kind={stampFor(flag.flag)} animate />
      </div>
      <h2 className="font-serif text-2xl font-bold leading-tight text-ink">
        {t(`tab.${flag.flag}`)}
      </h2>
      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink/70">
        <span className="font-mono">{flag.work_order_id}</span>
        <span lang={dataLang}>· {flag.road}</span>
        <StatusTag status={rec.status} />
      </p>

      <Part n={1} title={t("part.wrong")}>
        <div className="grid grid-cols-2 gap-2">
          <Stat label={t("billed")} value={inr(flag.billed_inr)} />
          <Stat label={t("rateCard")} value={inr(flag.rate_card_inr)} />
          <Stat label={t("ratio")} value={`${flag.cost_ratio.toFixed(2)}×`} />
          <Stat label={t("excess")} value={inr(flag.excess_inr)} />
        </div>

        {flag.flag === "DUPLICATE_BILL" && flag.original_work_order && (
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
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
          <p lang={dataLang} className="mt-3 border-l-4 border-ok bg-ok/10 p-3 text-sm text-ink">
            Road resurfaced on {flag.road_resurfaced_on}; still in warranty.
          </p>
        )}

        <details className="mt-3">
          <summary className="min-h-11 cursor-pointer py-2.5 text-sm font-semibold text-ink underline underline-offset-4">
            {t("allFields")}
          </summary>
          <dl lang={dataLang}>
            <Field k="Work order" v={<span className="font-mono">{flag.work_order_id}</span>} />
            <Field k="Ward" v={flag.ward} />
            <Field k="Road" v={flag.road} />
            <Field k="Contractor" v={cleanName(flag.contractor)} />
            <Field k="Method" v={flag.method} />
            <Field k="Work type" v={flag.work_type} />
            <Field k="Area" v={`${flag.area_sqm} sq m`} />
            <Field k="Completed" v={flag.completed_at} />
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
        </details>
      </Part>

      <Part n={2} title={t("part.why")}>
        <div lang={dataLang} className="space-y-2 text-sm text-ink">
          <p>{why.rule}</p>
          <p className="border-l-4 border-road bg-road/20 p-2 font-semibold tabular-nums">
            {why.threshold}
          </p>
          <p className="text-ink/80">{flag.reason}</p>
        </div>
      </Part>

      <Part n={3} title={t("part.next")}>
        <div lang={dataLang} className="space-y-2 text-sm text-ink">
          <p>{next.action}</p>
          <p className="font-semibold">
            <span className="text-ink/70">{t("owner")}:</span> {next.owner}
          </p>
        </div>
        <StatusPanel flag={flag} />
      </Part>

      <button
        onClick={runExplain}
        disabled={loading}
        className="mt-5 min-h-11 w-full border border-ink bg-ink px-4 text-sm font-semibold text-paper hover:bg-ink/90 disabled:opacity-60"
      >
        {loading ? t("explaining") : t("explain")}
      </button>
      {explain && (
        <p
          lang="en"
          aria-live="polite"
          className="mt-3 border border-ink/40 p-3 text-sm text-ink"
        >
          {explain.text}
          {explain.fallback && (
            <span className="mt-1 block text-xs text-ink/70">
              Showing the audit reason (AI explanation unavailable).
            </span>
          )}
        </p>
      )}
      <p className="mt-4 text-xs text-ink/70">{t("oneLine")}</p>
    </Drawer>
  );
}
