"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cleanName, FLAG_LABEL, inr } from "@/lib/format";
import { NORMAL_RANGE } from "@/lib/flagInfo";
import { useData, type Flag, type FlagType, type Ward } from "@/lib/data";
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
import FlagDrawer from "./FlagDrawer";
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
  children,
}: {
  n: number;
  title: string;
  mark?: string;
  last?: boolean;
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

function Trail({
  id,
  c,
  flags,
  roadName,
  onOpen,
}: {
  id: string;
  c: Complaint;
  flags: Flag[] | null;
  roadName?: string;
  onOpen: (f: Flag) => void;
}) {
  const { t, dataLang } = usePrefs();
  const w = c.work_order;
  const kind = statusKind(c.status);
  const steps: ReactNode[] = [];
  let n = 0;
  const step = (
    title: string,
    body: ReactNode,
    mark?: string,
  ) => {
    n += 1;
    steps.push(
      <Step key={n} n={n} title={title} mark={mark}>
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
  );

  const bad = kind === "rejected" || kind === "forwarded";
  step(
    t("cz.s.status"),
    <>
      <p className="font-serif text-2xl font-bold">
        <span aria-hidden="true">{bad ? "↪ " : kind === "done" ? "✓ " : "○ "}</span>
        <span lang={dataLang}>{c.status}</span>
      </p>
      <p lang={dataLang} className="mt-1 text-base text-ink/85">
        {statusSentence(c)}
      </p>
    </>,
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
          <div>
            <dt className="inline text-ink/70">{t("cz.method")}: </dt>
            <dd className="inline font-semibold">{w.method}</dd>
          </div>
          <div className="text-ink/75">
            {w.road} · {t("cz.done")} {fmtDate(w.completed_at)}
          </div>
        </dl>
      </>,
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
        <p lang={dataLang} className="font-serif text-2xl font-bold leading-snug">
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
          <h3 className="font-serif text-xl font-bold">{t("cz.draft")}</h3>
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
      <Trail id={rec.id} c={rec.c} flags={flags} roadName={roadName} onOpen={setOpen} />
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

/* ---------- search matches ---------- */

function Matches({
  list,
  extracted,
  onPick,
}: {
  list: Issue[];
  extracted: Extracted | null;
  onPick: (id: string) => void;
}) {
  const { t, dataLang } = usePrefs();
  if (list.length === 0)
    return (
      <p role="status" className="mt-6 border border-ink/40 p-4 text-lg">
        {t("cz.none")}
      </p>
    );
  return (
    <section aria-labelledby="match-h" className="mt-8">
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
            <p lang={dataLang} className="font-serif text-xl font-bold leading-tight">
              {i.road_name}
            </p>
            <p lang={dataLang} className="mt-0.5 text-sm text-ink/75">
              Ward {i.ward_code} · {i.main_issue} · {i.open_complaints} open ·
              risk {Math.round(i.risk_score)}/100
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {i.complaint_ids.slice(0, 4).map((id) => (
                <li key={id}>
                  <button
                    onClick={() => onPick(id)}
                    className="min-h-11 border-2 border-ink bg-paper px-3 font-mono text-base font-bold hover:bg-road/25"
                  >
                    {id}
                  </button>
                </li>
              ))}
              {i.complaint_ids.length > 4 && (
                <li className="flex min-h-11 items-center text-sm text-ink/70">
                  {t("cz.more", { n: i.complaint_ids.length - 4 })}
                </li>
              )}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- the view ---------- */

export default function CitizenView() {
  const { t } = usePrefs();
  const { data: issues } = useData<Issue[]>("issues.json");
  const { data: wards } = useData<Ward[]>("wards.json");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Key | null>(null);
  const [rec, setRec] = useState<Loaded | null>(null);
  const [matches, setMatches] = useState<{ list: Issue[]; ex: Extracted | null } | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const seq = useRef(0);

  useEffect(() => {
    // Keep the newest result in view on a phone.
    if ((rec || matches) && !busy)
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [rec, matches, busy]);

  async function lookup(id: string) {
    const my = ++seq.current;
    setBusy(true);
    setMsg(null);
    setMatches(null);
    setText(id);
    try {
      const r = await fetch(`/api/complaint/${id}`);
      if (my !== seq.current) return;
      if (r.status === 404) {
        setRec(null);
        setMsg("cz.notFound");
        return;
      }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setRec({ id: j.id, c: j.record });
    } catch {
      if (my === seq.current) {
        setRec(null);
        setMsg("cz.error");
      }
    } finally {
      if (my === seq.current) setBusy(false);
    }
  }

  async function find(q: string) {
    const my = ++seq.current;
    setBusy(true);
    setMsg(null);
    setRec(null);
    let ex: Extracted | null = null;
    try {
      const r = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "find", text: q }),
      });
      if (r.ok) ex = await r.json();
    } catch {
      /* fall through: match on the raw text */
    }
    if (my !== seq.current) return;
    setMatches({
      list: findIssues(issues ?? [], wards ?? [], ex ?? { road_or_locality: null, ward: null, issue_type: null }, q),
      ex,
    });
    setBusy(false);
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const q = text.trim();
    if (!q || busy) return;
    const m = q.match(ID_RE);
    if (m) void lookup(m[0].toUpperCase());
    else void find(q);
  }

  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-2xl px-4 py-6 focus:outline-none sm:py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/70">
        {t("role.citizen")}
      </p>
      <h1 className={`${serif} mt-1 text-4xl leading-tight sm:text-5xl`}>{t("cz.title")}</h1>
      <p className="mt-2 text-lg text-ink/80">{t("cz.sub")}</p>

      <form onSubmit={submit} className="mt-6">
        <label htmlFor="cz-input" className="block text-lg font-bold leading-snug">
          {t("cz.label")}
        </label>
        <textarea
          id="cz-input"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
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

      <div ref={resultRef} className="scroll-mt-4" aria-live="polite">
        {msg && (
          <p role="alert" className="mt-6 border-2 border-stamp p-4 text-lg font-semibold text-stamp">
            <span aria-hidden="true">✕ </span>
            {t(msg)}
          </p>
        )}
        {matches && !rec && (
          <Matches list={matches.list} extracted={matches.ex} onPick={(id) => void lookup(id)} />
        )}
      </div>
      {rec && (
        <WithFlags key={rec.id} need={!!rec.c.work_order?.flags.length}>
          {(flags) => <RecordBody rec={rec} flags={flags} wards={wards} issues={issues} />}
        </WithFlags>
      )}
    </main>
  );
}
