"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cleanName, FLAG_LABEL, inr } from "@/lib/format";
import { NORMAL_RANGE } from "@/lib/flagInfo";
import { DEFAULT_WARD, useData, type Flag, type FlagType, type Ward } from "@/lib/data";
import { usePrefs } from "@/lib/prefs";
import type { Key } from "@/lib/i18n";
import {
  buildComplaintText,
  findIssues,
  fmtDate,
  hoursBetween,
  ID_RE,
  plainSummary,
  recordLang,
  statusKind,
  statusSentence,
  textLang,
  type Complaint,
  type Extracted,
  type Issue,
} from "@/lib/citizen";
import {
  addFollowUp,
  followUpsFor,
  statusForWo,
  timeAgo,
  useFollowUps,
  useStatuses,
} from "@/lib/status";
import FlagDrawer from "./FlagDrawer";
import SourceTag from "./SourceTag";
import Stamp, { stampFor } from "./Stamp";

const serif = "font-serif font-bold tabular-nums";
const btn =
  "min-h-12 border-2 border-ink px-4 py-2 text-base font-bold text-ink hover:bg-road/25 disabled:opacity-50";

type Loaded = { id: string; c: Complaint };

/* ---------- the money-trail timeline ---------- */

function Step({
  n,
  title,
  mark,
  last,
  source,
  children,
}: {
  n: number;
  title: string;
  mark?: string;
  last?: boolean;
  source?: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="relative pb-6 pl-14 last:pb-0">
      {!last && (
        <span
          aria-hidden="true"
          className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-ink"
        />
      )}
      <span
        aria-hidden="true"
        className={`absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink text-lg ${serif} ${
          mark ? "bg-road" : "bg-paper"
        }`}
      >
        {mark ?? n}
      </span>
      <h3 className="min-h-10 pt-2 text-sm font-bold uppercase tracking-[0.12em] text-ink/80">
        {title}
        {source && (
          <span className="ml-2 align-middle normal-case tracking-normal">{source}</span>
        )}
      </h3>
      <div className="mt-1 text-lg leading-snug text-ink">{children}</div>
    </li>
  );
}

function Pill({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border-2 px-2 py-0.5 text-base font-bold ${
        ok ? "border-ok text-ok" : "border-stamp text-stamp"
      }`}
    >
      <span aria-hidden="true">{ok ? "✓" : "✕"}</span>
      {ok ? yes : no}
    </span>
  );
}

/** Whole days from a "YYYY-MM-DD HH:mm" timestamp to today (never negative). */
function daysSince(stamp: string): number | null {
  const d = new Date(stamp.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000));
}

function Trail({
  id,
  c,
  flags,
  wards,
  roadName,
  onOpen,
}: {
  id: string;
  c: Complaint;
  flags: Flag[] | null;
  wards: Ward[] | null;
  roadName?: string;
  onOpen: (f: Flag) => void;
}) {
  const { t, dataLang } = usePrefs();
  const w = c.work_order;
  const kind = statusKind(c.status);
  const daysOpen = daysSince(c.received_at);
  const wardOffice = wards?.find((x) => x.ward_code === c.ward)?.assistant_commissioner_office;
  const statuses = useStatuses();
  const allFollowUps = useFollowUps();
  const steps: ReactNode[] = [];
  let n = 0;
  const step = (
    title: string,
    body: ReactNode,
    mark?: string,
    source?: ReactNode,
  ) => {
    n += 1;
    steps.push(
      <Step key={n} n={n} title={title} mark={mark} source={source}>
        {body}
      </Step>,
    );
  };

  step(
    t("cz.s.received"),
    <>
      <p lang={textLang(c)} className="text-xl font-semibold">
        {c.description}
      </p>
      <p className="mt-1 text-base text-ink/75">
        {fmtDate(c.received_at)} ·{" "}
        {c.ward ? t("cz.ward", { w: c.ward }) : "Ward not recorded"} ·{" "}
        <span lang={dataLang}>{c.category}</span>
      </p>
    </>,
      undefined,
      <SourceTag of="complaints" />,
  );

  const bad = kind === "rejected" || kind === "forwarded";
  step(
    t("cz.s.status"),
    <>
      <p className="font-sans text-2xl font-bold">
        <span aria-hidden="true">{bad ? "↪ " : kind === "done" ? "✓ " : "○ "}</span>
        <span lang={dataLang}>{c.status}</span>
      </p>
      <p lang={dataLang} className="mt-1 text-base text-ink/85">
        {statusSentence(c)}
      </p>
      {(kind === "open" || kind === "progress") && daysOpen != null && (
        <p lang={dataLang} className="mt-2 inline-block border-2 border-ink px-2 py-0.5 text-lg font-semibold">
          <span aria-hidden="true">⏱ </span>
          Open for{" "}
          <span className={`${serif} text-xl`}>{daysOpen.toLocaleString("en-IN")}</span>{" "}
          {daysOpen === 1 ? "day" : "days"}
        </p>
      )}
    </>,
      undefined,
      <SourceTag of="complaints" />,
  );

  if (w) {
    step(
      t("cz.s.job"),
      <>
        <p className="font-mono text-xl font-bold">{w.id}</p>
        <dl className="mt-1 space-y-0.5 text-base" lang={dataLang}>
          <div>
            <dt className="inline text-ink/70">{t("cz.contractor")}: </dt>
            <dd className="inline font-semibold">{cleanName(w.contractor)}</dd>
          </div>
          {wardOffice && (
            <div>
              <dt className="inline text-ink/70">{t("wardOffice")}: </dt>
              <dd className="inline font-semibold">{wardOffice}</dd>{" "}
              <span className="border border-ink px-1 text-xs font-semibold uppercase tracking-wide">
                {t("accountable")}
              </span>
            </div>
          )}
          <div>
            <dt className="inline text-ink/70">{t("cz.method")}: </dt>
            <dd className="inline font-semibold">{w.method}</dd>
          </div>
          <div className="text-ink/75">
            {w.road} · {t("cz.done")} {fmtDate(w.completed_at)}
          </div>
        </dl>
      </>,
      undefined,
      <SourceTag of="workOrders" />,
    );

    const high = w.cost_ratio >= 1.5;
    const first = w.flags
      .map((code) => flags?.find((f) => f.work_order_id === w.id && f.flag === code))
      .find(Boolean);
    step(
      t("cz.s.cost"),
      <>
        <p className={`${serif} text-4xl leading-none`}>{inr(w.billed_inr)}</p>
        <p className="mt-1 text-base">
          vs rate card <span className={`${serif} text-xl`}>{inr(w.rate_card_inr)}</span>
        </p>
        <p
          className={`mt-2 inline-flex items-center gap-1.5 border-2 px-2 py-0.5 text-lg ${serif} ${
            high ? "border-stamp text-stamp" : "border-ink text-ink"
          }`}
        >
          <span aria-hidden="true">{high ? "▲" : "="}</span>
          {t("cz.times", { x: w.cost_ratio.toFixed(2) })}
        </p>
        <p lang={dataLang} className="mt-1 text-sm text-ink/70">
          Normal range {NORMAL_RANGE}.
        </p>
        {first && (
          <p className="mt-2">
            <button
              onClick={() => onOpen(first)}
              className="min-h-11 text-base font-semibold underline underline-offset-4"
            >
              {t("cz.seeEvidence")} →
            </button>
          </p>
        )}
      </>,
      "₹",
      <SourceTag of="workOrders" extra="rates" />,
    );

    const took = hoursBetween(c.received_at, w.completed_at);
    step(
      t("cz.s.deadline"),
      <>
        <Pill ok={w.sla_met} yes={t("cz.met")} no={t("cz.missed")} />
        <p lang={dataLang} className="mt-1 text-base text-ink/80">
          Target {w.sla_hours} hours
          {took != null ? `; finished in ${took} hours` : ""}.
        </p>
      </>,
      undefined,
      <SourceTag of="fixes" />,
    );

    step(
      t("cz.s.held"),
      <>
        <Pill ok={w.held_up_30d} yes={t("cz.yes")} no={t("cz.no")} />
        <p lang={dataLang} className="mt-1 text-base text-ink/80">
          {w.held_up_30d
            ? "The repair held: the road did not fail again within 30 days."
            : "The road failed again within 30 days of the repair."}
        </p>
      </>,
      undefined,
      <SourceTag of="fixes" />,
    );

    if (w.flags.length > 0)
      step(
        t("cz.s.flags"),
        <ul className="space-y-3">
          {w.flags.map((code) => {
            const f = flags?.find((x) => x.work_order_id === w.id && x.flag === code);
            const type = code as FlagType;
            return (
              <li key={code} className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <Stamp kind={stampFor(type)} animate />
                <span lang={dataLang} className="text-base font-semibold">
                  {FLAG_LABEL[code] ?? code}
                </span>
                {f && (
                  <button
                    onClick={() => onOpen(f)}
                    className="min-h-11 text-base font-semibold underline underline-offset-4"
                  >
                    {t("cz.seeEvidence")} →
                  </button>
                )}
              </li>
            );
          })}
        </ul>,
      );
  } else if (c.open_issue) {
    step(
      t("cz.s.open"),
      <>
        <p lang={dataLang} className="font-sans text-2xl font-bold leading-snug">
          Still open: ranked{" "}
          <span className="text-hazard">#{c.open_issue.city_risk_rank}</span> of{" "}
          {c.open_issue.of} risky roads citywide
        </p>
        {roadName && (
          <p lang={dataLang} className="mt-1 text-base text-ink/80">
            {roadName}
          </p>
        )}
        <p lang={dataLang} className="mt-1 text-base text-ink/80">
          No repair job has been billed yet, so there is no rupee amount to follow.
        </p>
      </>,
      "!",
    );
  } else if (kind === "open" || kind === "progress") {
    step(
      t("cz.s.open"),
      <p lang={dataLang}>
        Still open. It is not yet linked to a road in our risk ranking, and no
        repair job has been billed.
      </p>,
      "!",
    );
  }

  // What the ward office did with this job, and what the citizen sent back.
  const action = w ? statusForWo(statuses, w.id) : null;
  if (action)
    step(
      `${t("cz.s.ward")}: ${t(`status.${action.status}` as Key)} · ${timeAgo(action.updatedAt)}`,
      action.reason ? (
        <p lang={dataLang} className="text-base">
          <span className="font-semibold">
            {t(action.status === "contested" ? "contestedReason" : "reasonShown")}:
          </span>{" "}
          {action.reason}
        </p>
      ) : (
        <p lang={dataLang} className="text-base text-ink/80">
          {t(`status.${action.status}` as Key)}
        </p>
      ),
    );
  for (const fu of [...followUpsFor(allFollowUps, id)].reverse())
    step(
      `${t("cz.s.followup")}: ${fu.ref}`,
      <>
        <p lang={textLang(c)} className="text-base">
          {fu.text}
        </p>
        <p className="mt-1 text-sm text-ink/70">{timeAgo(fu.updatedAt)}</p>
      </>,
    );
  if (action || allFollowUps.some((f) => f.complaintId === id))
    steps.push(
      <li key="demo" className="pb-2 pl-14 text-xs text-ink/70">
        {t("demoNote")}
      </li>,
    );

  return (
    <ol aria-label={t("cz.trail", { id })} className="mt-4">
      {steps}
    </ol>
  );
}

/* ---------- actions: explain + complain ---------- */

function Actions({
  id,
  c,
  flags,
  wards,
  roadName,
}: {
  id: string;
  c: Complaint;
  flags: Flag[] | null;
  wards: Ward[] | null;
  roadName?: string;
}) {
  const { t, lang: uiLang, dataLang } = usePrefs();
  const lang = uiLang !== "en" ? uiLang : recordLang(c);
  const [ex, setEx] = useState<{ text: string; fallback: boolean; lang: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(false);
  const [copied, setCopied] = useState(false);
  const [followNote, setFollowNote] = useState("");
  const [sent, setSent] = useState<{ id: string; ref: string } | null>(null);

  const complaint = useMemo(
    () => buildComplaintText(id, c, { wards, flags, roadName }),
    [id, c, wards, flags, roadName],
  );

  async function explain() {
    setBusy(true);
    const record = {
      complaint_id: id,
      ...c,
      road_name: roadName,
      flag_labels: c.work_order?.flags.map((f) => FLAG_LABEL[f] ?? f),
      fallback_summary: plainSummary(id, c, roadName),
    };
    try {
      const r = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "citizen", record, lang }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      if (!j.text) throw new Error("empty");
      setEx({ text: j.text, fallback: !!j.fallback, lang });
    } catch {
      setEx({ text: plainSummary(id, c, roadName), fallback: true, lang: "en" });
    } finally {
      setBusy(false);
    }
  }

  function submitFollowUp() {
    const w = c.work_order;
    const text =
      followNote.trim() ||
      `Please review complaint ${id}${w ? ` (work order ${w.id})` : ""} and tell me what action is being taken.`;
    setSent({ id, ref: addFollowUp(id, w?.id ?? null, text) });
    setFollowNote("");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(complaint);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = complaint;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <section className="mt-8 border-t-4 border-double border-ink pt-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button onClick={explain} disabled={busy} className={`${btn} bg-road`}>
          {busy ? t("explaining") : t("cz.explain")}
        </button>
        <button onClick={() => setDraft((d) => !d)} aria-expanded={draft} className={btn}>
          {t("cz.complain")}
        </button>
      </div>

      <div aria-live="polite">
        {ex && (
          <div className="mt-4 border border-ink/50 bg-white/40 p-4">
            <p lang={ex.lang} className="text-xl leading-relaxed">
              {ex.text}
            </p>
            {ex.fallback && (
              <p lang={dataLang} className="mt-2 text-sm text-ink/70">
                {t("cz.fallbackNote")}
              </p>
            )}
          </div>
        )}
      </div>

      {draft && (
        <div className="mt-4 border border-ink/50 bg-white/40 p-4">
          <h3 className="font-sans text-xl font-bold">{t("cz.draft")}</h3>
          <p className="mt-1 text-sm text-ink/75">{t("cz.draftNote")}</p>
          <pre
            lang="en"
            className="mt-3 whitespace-pre-wrap break-words border border-ink/30 bg-paper p-3 font-sans text-base leading-relaxed"
          >
            {complaint}
          </pre>
          <div className="mt-3 flex items-center gap-3">
            <button onClick={copy} className={btn}>
              {t("cz.copy")}
            </button>
            <span aria-live="polite" className="text-base font-bold text-ok">
              {copied && `✓ ${t("cz.copied")}`}
            </span>
          </div>
          <div className="mt-4 border-t border-ink/30 pt-3">
            <label htmlFor="fu-note" className="block text-base font-semibold">
              {t("cz.followNote")}
            </label>
            <textarea
              id="fu-note"
              maxLength={300}
              rows={2}
              value={followNote}
              onChange={(e) => setFollowNote(e.target.value)}
              className="mt-1 w-full border-2 border-ink bg-paper p-2 text-base"
            />
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button onClick={submitFollowUp} className={`${btn} bg-road`}>
                {t("cz.submitFollowUp")}
              </button>
              <span aria-live="polite" className="text-base font-bold text-ok">
                {sent?.id === id && `✓ ${t("cz.followRecorded", { ref: sent.ref })}`}
              </span>
            </div>
            <p className="mt-2 text-xs text-ink/70">{t("demoNote")}</p>
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------- record = trail + actions, loading flags.json only when needed ---------- */

function RecordBody({
  rec,
  flags,
  wards,
  issues,
}: {
  rec: Loaded;
  flags: Flag[] | null;
  wards: Ward[] | null;
  issues: Issue[] | null;
}) {
  const { t } = usePrefs();
  const [open, setOpen] = useState<Flag | null>(null);
  const roadName = rec.c.open_issue
    ? issues?.find((i) => i.road_id === rec.c.open_issue!.road_id)?.road_name
    : undefined;
  return (
    <section aria-labelledby="trail-h" className="mt-8">
      <h2 id="trail-h" className={`${serif} text-2xl sm:text-3xl`}>
        {t("cz.trail", { id: rec.id })}
      </h2>
      <Trail id={rec.id} c={rec.c} flags={flags} wards={wards} roadName={roadName} onOpen={setOpen} />
      <Actions id={rec.id} c={rec.c} flags={flags} wards={wards} roadName={roadName} />
      {open && flags && (
        <FlagDrawer flag={open} allFlags={flags} onClose={() => setOpen(null)} />
      )}
    </section>
  );
}

function WithFlags({
  need,
  children,
}: {
  need: boolean;
  children: (flags: Flag[] | null) => ReactNode;
}) {
  return need ? <FlagsLoaded>{children}</FlagsLoaded> : <>{children(null)}</>;
}
function FlagsLoaded({ children }: { children: (flags: Flag[] | null) => ReactNode }) {
  const { data } = useData<Flag[]>("flags.json");
  return <>{children(data)}</>;
}

/* ---------- example + suggestion chips ---------- */

type Example = { value: string; sub?: string; lang?: string; mono?: boolean };

const EXAMPLES: Example[] = [
  { value: "BMC25-000726", sub: "Marathi · still open", mono: true },
  { value: "BMC25-000009", sub: "billed 2.2×", mono: true },
  { value: "धारावी मध्ये पाणी साचले आहे", sub: "describe in Marathi", lang: "mr" },
];

const SUGGESTIONS: Example[] = [
  { value: "SV Road" },
  { value: "Andheri pothole" },
  { value: "Eastern Express Highway" },
  { value: "BMC25-000726", mono: true },
];

function Chips({
  items,
  onRun,
  label,
}: {
  items: Example[];
  onRun: (q: string) => void;
  label: string;
}) {
  return (
    <ul aria-label={label} className="flex flex-wrap gap-2">
      {items.map((x) => (
        <li key={x.value} className="max-w-full">
          <button
            type="button"
            onClick={() => onRun(x.value)}
            className="min-h-11 max-w-full border-2 border-ink bg-paper px-3 py-1.5 text-left hover:bg-road/25"
          >
            <span
              lang={x.lang}
              className={`block break-words text-base font-bold leading-snug ${x.mono ? "font-mono" : ""}`}
            >
              {x.value}
            </span>
            {x.sub && <span className="block text-sm text-ink/75">{x.sub}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ---------- search matches ---------- */

function IdChips({
  ids,
  onPick,
  max,
}: {
  ids: string[];
  onPick: (id: string) => void;
  max: number;
}) {
  const { t } = usePrefs();
  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {ids.slice(0, max).map((id) => (
        <li key={id}>
          <button
            onClick={() => onPick(id)}
            aria-label={`Open the money trail for ${id}`}
            className="min-h-11 border-2 border-ink bg-paper px-3 font-mono text-base font-bold hover:bg-road/25"
          >
            {id}
          </button>
        </li>
      ))}
      {ids.length > max && (
        <li className="flex min-h-11 items-center text-sm text-ink/70">
          {t("cz.more", { n: ids.length - max })}
        </li>
      )}
    </ul>
  );
}

function RiskBar({ score }: { score: number }) {
  const v = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <div aria-hidden="true" className="h-2.5 flex-1 border border-ink bg-white/60">
        <div className="h-full bg-hazard" style={{ width: `${v}%` }} />
      </div>
      <span className={`${serif} text-base`}>
        <span className="sr-only">Risk </span>
        {v}/100
      </span>
    </div>
  );
}

function Suggestions({ onRun }: { onRun: (q: string) => void }) {
  const { t } = usePrefs();
  return (
    <div className="mt-3">
      <p className="mb-2 text-base font-bold">{t("cz.suggest")}</p>
      <Chips items={SUGGESTIONS} onRun={onRun} label={t("cz.suggest")} />
    </div>
  );
}

function Matches({
  list,
  extracted,
  query,
  onPick,
  onRun,
}: {
  list: Issue[];
  extracted: Extracted | null;
  query: string;
  onPick: (id: string) => void;
  onRun: (q: string) => void;
}) {
  const { t, dataLang } = usePrefs();
  if (list.length === 0)
    return (
      <div role="status" className="mt-4 border-2 border-ink p-4">
        <p className="text-lg">
          <span className="font-bold">
            <span aria-hidden="true">○ </span>
            No match for “<span lang={textLangOf(query)}>{query}</span>”.
          </span>{" "}
          {t("cz.none")}
        </p>
        <Suggestions onRun={onRun} />
      </div>
    );
  return (
    <section aria-labelledby="match-h" className="mt-6">
      <h2 id="match-h" className={`${serif} text-2xl`}>
        {t("cz.matches")}
      </h2>
      <p className="mt-1 text-base text-ink/75">
        {extracted && (extracted.road_or_locality || extracted.ward || extracted.issue_type) && (
          <span lang="en">
            {[extracted.road_or_locality, extracted.ward && `Ward ${extracted.ward}`, extracted.issue_type]
              .filter(Boolean)
              .join(" · ")}
            {" — "}
          </span>
        )}
        {t("cz.matchesHelp")}
      </p>
      <ul className="mt-3 space-y-3">
        {list.map((i) => (
          <li key={i.road_id} className="border border-ink/50 bg-white/40 p-3">
            <p lang={dataLang} className="font-sans text-xl font-bold leading-tight">
              {i.road_name}
            </p>
            <p lang={dataLang} className="mt-0.5 text-sm text-ink/75">
              Ward {i.ward_code} · {i.main_issue} · {i.open_complaints} open
            </p>
            <RiskBar score={i.risk_score} />
            <IdChips ids={i.complaint_ids} onPick={onPick} max={4} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function textLangOf(s: string): string | undefined {
  return /[ऀ-ॿ]/.test(s) ? "mr" : undefined;
}

/* ---------- "My ward": works with no search ---------- */

type Fix = {
  id: string;
  completed_at: string;
  road: string;
  billed_inr: number;
  held_up_30d: boolean;
  flags: string[];
};
type FixState = { ward: string; items: Fix[] | null; error: boolean };

// Count lines come straight from wards.json `flags`, one per flag type.
const FLAG_ORDER: FlagType[] = ["OVERBILLED", "DUPLICATE_BILL", "DLP_PAID", "DLP_REVIEW"];
const FLAG_SHORT: Record<FlagType, string> = {
  OVERBILLED: "above rate card",
  DUPLICATE_BILL: "possibly paid twice",
  DLP_PAID: "paid in warranty",
  DLP_REVIEW: "warranty to check",
};

function WardCard({ w }: { w: Ward }) {
  const over = w.spend_inr > w.budget_inr;
  const nFlags = Object.values(w.flags).reduce((a, b) => a + b, 0);
  const row = "border-t border-ink/40 py-3 first:border-t-0";
  return (
    <div className="border-2 border-ink bg-white/40 px-4 py-1">
      <div className={row}>
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-ink/80">
          Spent vs budget
        </p>
        <p className={`${serif} mt-1 text-3xl leading-none`}>{inr(w.spend_inr)}</p>
        <p className="mt-1 text-base">
          spent of a {inr(w.budget_inr)} road-repair budget ({Math.round(w.utilisation_pct)}%).
          {over && (
            <span className="ml-1 font-bold text-stamp">
              <span aria-hidden="true">▲ </span>
              {inr(w.spend_inr - w.budget_inr)} over budget.
            </span>
          )}
        </p>
      </div>
      <div className={row}>
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-ink/80">Needs review</p>
        <p className={`${serif} mt-1 text-3xl leading-none text-stamp`}>
          {inr(w.flagged_excess_inr)}
        </p>
        <p className="mt-1 text-base">
          flagged for review: billed above rate card, possibly paid twice, or paid
          during warranty ({nFlags} {nFlags === 1 ? "flag" : "flags"}). These are
          items to check, not findings.
        </p>
        <p className="mt-1 text-sm text-ink/80">
          {FLAG_ORDER.map((code) => `${w.flags[code] ?? 0} ${FLAG_SHORT[code]}`).join(" · ")}
        </p>
      </div>
      <div className={row}>
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-ink/80">
          On failed repairs
        </p>
        <p className={`${serif} mt-1 text-3xl leading-none`}>{inr(w.failed_fix_spend_inr)}</p>
        <p className="mt-1 text-base">
          spent on repairs where the road failed again within 30 days.
        </p>
      </div>
    </div>
  );
}

function MyWard({
  issues,
  wards,
  ward,
  setWard,
  onOpen,
}: {
  issues: Issue[] | null;
  wards: Ward[] | null;
  ward: string;
  setWard: (w: string) => void;
  onOpen: (id: string) => void;
}) {
  const [fixes, setFixes] = useState<FixState | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`/api/complaints?ward=${encodeURIComponent(ward)}&limit=5`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => live && setFixes({ ward, items: j.items, error: false }))
      .catch(() => live && setFixes({ ward, items: null, error: true }));
    return () => {
      live = false;
    };
  }, [ward]);

  const w = wards?.find((x) => x.ward_code === ward);
  const top = useMemo(
    () =>
      (issues ?? [])
        .filter((i) => i.ward_code === ward)
        .sort((a, b) => b.risk_score - a.risk_score)
        .slice(0, 5),
    [issues, ward],
  );
  const loadingFixes = !fixes || fixes.ward !== ward;
  const h = `${serif} text-2xl`;

  return (
    <section lang="en" aria-labelledby="mw-h" className="mt-10 border-t-4 border-double border-ink pt-6 lg:mt-0 lg:border-t-0 lg:pt-0">
      <h2 id="mw-h" className={`${serif} text-3xl`}>
        My ward
      </h2>
      <label htmlFor="mw-ward" className="mt-3 block text-base font-bold">
        Choose your ward
      </label>
      <select
        id="mw-ward"
        value={ward}
        onChange={(e) => setWard(e.target.value)}
        className="mt-1 block min-h-12 w-full border-2 border-ink bg-white/60 px-3 text-lg"
      >
        {(wards ?? [{ ward_code: DEFAULT_WARD, ward_name: "" } as Ward]).map((x) => (
          <option key={x.ward_code} value={x.ward_code}>
            {x.ward_code}
            {x.ward_name ? ` · ${x.ward_name}` : ""}
          </option>
        ))}
      </select>

      <div className="mt-4">{w ? <WardCard w={w} /> : <p role="status">Loading ward figures…</p>}</div>

      <h3 className={`${h} mt-8`}>Open problems near you</h3>
      <p className="mt-1 text-base text-ink/75">Highest risk first. Tap a complaint ID to follow it.</p>
      {!issues ? (
        <p role="status" className="mt-3">Loading…</p>
      ) : top.length === 0 ? (
        <p className="mt-3 border border-ink/40 p-3 text-base">No open road problems in this ward.</p>
      ) : (
        <ol className="mt-3 space-y-3">
          {top.map((i, n) => (
            <li key={i.road_id} className="border border-ink/50 bg-white/40 p-3">
              <p className="font-sans text-xl font-bold leading-tight">
                <span className="sr-only">{n + 1}. </span>
                {i.road_name}
              </p>
              <p className="mt-0.5 text-sm text-ink/75">
                {i.main_issue} · {i.open_complaints} open{" "}
                {i.open_complaints === 1 ? "complaint" : "complaints"}
              </p>
              <RiskBar score={i.risk_score} />
              <IdChips ids={i.complaint_ids} onPick={onOpen} max={3} />
            </li>
          ))}
        </ol>
      )}

      <h3 className={`${h} mt-8`}>Recent fixes</h3>
      <p className="mt-1 text-base text-ink/75">The latest resolved complaints, and whether the repair held.</p>
      {loadingFixes ? (
        <p role="status" className="mt-3">Loading recent fixes…</p>
      ) : fixes.error || !fixes.items ? (
        <p role="alert" className="mt-3 border-2 border-stamp p-3 text-base font-semibold text-stamp">
          <span aria-hidden="true">✕ </span>
          Could not load recent fixes. Please try again.
        </p>
      ) : fixes.items.length === 0 ? (
        <p className="mt-3 border border-ink/40 p-3 text-base">No resolved complaints in this ward yet.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {fixes.items.map((f) => (
            <li key={f.id} className="border border-ink/50 bg-white/40 p-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <button
                  onClick={() => onOpen(f.id)}
                  aria-label={`Open the money trail for ${f.id}`}
                  className="min-h-11 border-2 border-ink bg-paper px-3 font-mono text-base font-bold hover:bg-road/25"
                >
                  {f.id}
                </button>
                <Pill ok={f.held_up_30d} yes="Held 30 days" no="Failed within 30 days" />
              </div>
              <p className="mt-1 text-base font-semibold">{f.road.replace(/\s*\(RD\d+\)\s*$/, "")}</p>
              <p className="text-sm text-ink/75">
                Fixed {fmtDate(f.completed_at)} · billed{" "}
                <span className={`${serif} text-base`}>{inr(f.billed_inr)}</span>
                {f.flags.length > 0 && (
                  <span className="ml-2 font-bold text-stamp">
                    <span aria-hidden="true">⚑ </span>Needs review
                  </span>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------- the view ---------- */

type MatchState = { list: Issue[]; ex: Extracted | null; degraded: boolean; q: string };

export default function CitizenView() {
  const { t } = usePrefs();
  const { data: issues } = useData<Issue[]>("issues.json");
  const { data: wards } = useData<Ward[]>("wards.json");
  const [text, setText] = useState("");
  const [ward, setWard] = useState(DEFAULT_WARD); // kept here so it survives opening a trail
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Key | null>(null);
  const [rec, setRec] = useState<Loaded | null>(null);
  const [matches, setMatches] = useState<MatchState | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const seq = useRef(0);

  const hasResult = !!(rec || matches || msg);

  useEffect(() => {
    // Keep the newest result in view on a phone.
    if ((rec || matches || msg) && !busy)
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [rec, matches, msg, busy]);

  async function lookup(id: string) {
    const my = ++seq.current;
    setBusy(true);
    setMsg(null);
    setMatches(null);
    setRec(null);
    setText(id);
    try {
      const r = await fetch(`/api/complaint/${id}`);
      if (my !== seq.current) return;
      if (r.status === 404) {
        setMsg("cz.notFound");
        return;
      }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setRec({ id: j.id, c: j.record });
    } catch {
      if (my === seq.current) setMsg("cz.error");
    } finally {
      if (my === seq.current) setBusy(false);
    }
  }

  async function find(q: string) {
    const my = ++seq.current;
    setBusy(true);
    setMsg(null);
    setRec(null);
    setMatches(null);
    let ex: Extracted | null = null;
    let degraded = false;
    try {
      const r = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "find", text: q }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      // The route answers 200 with fallback:true when the model call itself failed.
      if (j.fallback) degraded = true;
      else ex = j;
    } catch {
      degraded = true; // fall back to matching the raw text
    }
    if (my !== seq.current) return;
    const none: Extracted = { road_or_locality: null, ward: null, issue_type: null };
    setMatches({
      list: findIssues(issues ?? [], wards ?? [], ex ?? none, q),
      ex,
      degraded,
      q,
    });
    setBusy(false);
  }

  /** Runs a search from the box, a chip or a suggestion. */
  function run(raw: string) {
    const q = raw.trim();
    if (!q || busy) return;
    setText(q);
    const m = q.match(ID_RE);
    if (m) void lookup(m[0].toUpperCase());
    else void find(q);
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    run(text);
  }

  function reset() {
    seq.current += 1;
    setBusy(false);
    setRec(null);
    setMatches(null);
    setMsg(null);
    setText("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main
      id="main"
      tabIndex={-1}
      className="mx-auto max-w-2xl px-4 py-6 focus:outline-none sm:py-10 lg:grid lg:max-w-6xl lg:grid-cols-[minmax(0,40rem)_minmax(0,1fr)] lg:items-start lg:gap-x-12"
    >
      <div className="min-w-0">
      <p className="inline-block border border-ink/60 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.18em] text-ink/80">
        {t("cz.tag")}
      </p>
      <h1 className={`${serif} mt-2 text-4xl leading-tight sm:text-5xl`}>{t("cz.title")}</h1>
      <p className="mt-2 text-lg text-ink/80">{t("cz.sub")}</p>

      <form onSubmit={submit} className="mt-6">
        <label htmlFor="cz-input" className="block text-lg font-bold leading-snug">
          {t("cz.label")}
        </label>
        <textarea
          id="cz-input"
          rows={2}
          value={text}
          enterKeyHint="search"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Enter submits; Shift+Enter adds a line. Not while an IME (Marathi/Hindi) is composing.
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          aria-describedby="cz-hint"
          className="mt-2 block w-full resize-y border-2 border-ink bg-white/60 p-3 text-xl leading-snug"
        />
        <p id="cz-hint" className="mt-1 text-sm text-ink/70">
          {t("cz.hint")}
        </p>
        <button type="submit" disabled={busy || !text.trim()} className={`${btn} mt-3 w-full bg-road`}>
          {busy ? t("cz.finding") : t("cz.go")}
        </button>
      </form>

      <div className="mt-5">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.12em] text-ink/80">{t("cz.try")}</p>
        <Chips items={EXAMPLES} onRun={run} label={t("cz.try")} />
      </div>

      <div ref={resultRef} className="scroll-mt-4" aria-live="polite">
        {busy && (
          <p role="status" className="mt-6 border-2 border-ink p-4 text-lg font-semibold">
            <span aria-hidden="true">⋯ </span>
            {t("cz.finding")}
          </p>
        )}
        {!busy && hasResult && (
          <button onClick={reset} className={`${btn} mt-6`}>
            <span aria-hidden="true">← </span>
            {t("cz.back")}
          </button>
        )}
        {!busy && msg && (
          <div role="alert" className="mt-4 border-2 border-stamp p-4">
            <p className="text-lg font-semibold text-stamp">
              <span aria-hidden="true">✕ </span>
              {t(msg)}
            </p>
            <Suggestions onRun={run} />
          </div>
        )}
        {!busy && matches && !rec && (
          <>
            {matches.degraded && (
              <p role="status" className="mt-4 border-2 border-hazard p-3 text-base font-semibold">
                <span aria-hidden="true">! </span>
                {t("cz.degraded")}
              </p>
            )}
            <Matches
              list={matches.list}
              extracted={matches.ex}
              query={matches.q}
              onPick={(id) => void lookup(id)}
              onRun={run}
            />
          </>
        )}
      </div>
      {rec && !busy && (
        <WithFlags key={rec.id} need={!!rec.c.work_order?.flags.length}>
          {(flags) => <RecordBody rec={rec} flags={flags} wards={wards} issues={issues} />}
        </WithFlags>
      )}
      </div>
      {/* Phones: only before a search. lg+: always, in the right column. */}
      <div
        className={`min-w-0 lg:border-l-2 lg:border-ink lg:pl-8 ${hasResult || busy ? "hidden lg:block" : ""}`}
      >
        <MyWard issues={issues} wards={wards} ward={ward} setWard={setWard} onOpen={(id) => void lookup(id)} />
      </div>
    </main>
  );
}
