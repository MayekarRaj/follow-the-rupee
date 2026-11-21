"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePrefs } from "@/lib/prefs";
import {
  buildSheet,
  localNote,
  sheetToText,
  type NoteFlag,
  type NoteLang,
  type NoteText,
  type NoteWard,
} from "@/lib/escalation";

type Draft = { note: NoteText; fallback: boolean };

// Drafts already fetched this session, keyed like the server cache (WO id + lang).
const drafts = new Map<string, Draft>();

const FOCUSABLE = "button:not([disabled])";

/**
 * Printable escalation note in a modal. Fetches the draft from /api/explain
 * (mode "escalation"); if that fails, the same sheet is filled from the local
 * template so the demo never breaks. Print CSS (globals.css, .esc-root) hides
 * everything except the sheet.
 */
export default function EscalationSheet({
  flag,
  ward,
  onClose,
}: {
  flag: NoteFlag;
  ward: NoteWard;
  onClose: () => void;
}) {
  const { t } = usePrefs();
  const [lang, setLang] = useState<NoteLang>("en");
  const [, bump] = useState(0);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  // Reuse a draft fetched earlier this session, otherwise fetch it once.
  const key = `${flag.work_order_id}|${lang}`;
  const draft = drafts.get(key) ?? null;
  useEffect(() => {
    if (drafts.has(key)) return;
    let live = true;
    (async () => {
      let d: Draft;
      try {
        const r = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "escalation", record: flag, ward, lang }),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        if (!j.note) throw new Error("empty");
        d = { note: j.note as NoteText, fallback: false };
      } catch {
        d = { note: localNote(flag, ward, lang), fallback: true };
      }
      drafts.set(key, d);
      if (live) bump((n) => n + 1);
    })();
    return () => {
      live = false;
    };
  }, [key, flag, ward, lang]);

  // Modal behaviour: focus in, Esc closes only this sheet (capture phase so the
  // drawer underneath does not also close), Tab stays inside, focus returns.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    rootRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !rootRef.current) return;
      const items = Array.from(
        rootRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (!rootRef.current.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, []);

  const sheet = draft ? buildSheet(flag, ward, draft.note, lang) : null;

  async function copy() {
    if (!sheet) return;
    try {
      await navigator.clipboard.writeText(sheetToText(sheet));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (http, permissions); the sheet stays selectable.
    }
  }

  const btn =
    "min-h-11 border border-ink px-3 text-sm font-semibold text-ink hover:bg-road/25 disabled:opacity-50";
  const tab = (on: boolean) =>
    `min-h-11 border border-ink px-3 text-sm font-semibold ${
      on ? "bg-ink text-paper" : "text-ink hover:bg-road/25"
    }`;

  return createPortal(
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={t("esc.title")}
      className="esc-root fixed inset-0 z-[60] overflow-y-auto bg-ink/60 p-3 sm:p-6"
    >
      <div className="mx-auto max-w-3xl">
        <div className="no-print mb-3 flex flex-wrap items-center gap-2 border-2 border-ink bg-paper p-2">
          <div role="group" aria-label={t("esc.lang")} className="flex">
            <button
              aria-pressed={lang === "en"}
              onClick={() => setLang("en")}
              className={tab(lang === "en")}
            >
              EN
            </button>
            <button
              lang="mr"
              aria-pressed={lang === "mr"}
              onClick={() => setLang("mr")}
              className={`${tab(lang === "mr")} -ml-px`}
            >
              मराठी
            </button>
          </div>
          <span className="flex-1" />
          <button className={btn} onClick={copy} disabled={!sheet}>
            {copied ? t("esc.copied") : t("esc.copy")}
          </button>
          <button className={btn} onClick={() => window.print()} disabled={!sheet}>
            {t("esc.print")}
          </button>
          <button className={btn} onClick={onClose}>
            {t("close")}
          </button>
        </div>
        <p aria-live="polite" className="sr-only">
          {copied ? t("esc.copied") : ""}
        </p>

        <article
          lang={lang}
          aria-busy={!sheet}
          className="esc-sheet border border-ink bg-white px-5 py-6 text-[0.92rem] leading-relaxed text-ink sm:px-10 sm:py-9"
        >
          {!sheet ? (
            <p className="py-16 text-center text-sm text-ink/70" lang="en">
              {t("esc.drafting")}
            </p>
          ) : (
            <Sheet s={sheet} fallback={draft!.fallback} />
          )}
        </article>
      </div>
    </div>,
    document.body,
  );
}

function Sheet({
  s,
  fallback,
}: {
  s: ReturnType<typeof buildSheet>;
  fallback: boolean;
}) {
  const { t } = usePrefs();
  return (
    <>
      <p className="border border-dashed border-ink/60 px-2 py-1 text-center text-xs font-semibold text-ink/80">
        {s.topNote}
      </p>
      {fallback && (
        <p lang="en" className="no-print mt-1 text-center text-xs text-ink/70">
          {t("esc.fallback")}
        </p>
      )}

      <header className="mt-5 text-center">
        <h2 className="font-serif text-xl font-bold uppercase tracking-wide">
          {s.header[0]}
        </h2>
        <p className="mt-1 text-sm">{s.header[1]}</p>
        <p className="text-sm">{s.header[2]}</p>
      </header>
      <div className="mt-3 border-t-4 border-double border-ink" />

      <div className="mt-4 flex flex-wrap justify-between gap-x-6 gap-y-1">
        <span>{s.outward}</span>
        <span>{s.date}</span>
      </div>

      <div className="mt-4">
        {s.to.map((l) => (
          <p key={l}>{l}</p>
        ))}
      </div>

      <h3 className="mt-6 text-center font-serif text-lg font-bold underline underline-offset-4">
        {s.title}
      </h3>

      <dl className="mt-5 grid grid-cols-[4.5rem_1fr] gap-x-2 gap-y-2">
        <dt className="font-bold">{s.subLabel}</dt>
        <dd className="font-semibold">{s.sub}</dd>
        <dt className="font-bold">{s.refLabel}</dt>
        <dd>
          <ol className="list-decimal space-y-0.5 pl-5">
            {s.ref.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
        </dd>
      </dl>

      <p className="mt-5">{s.salutation}</p>
      <p className="mt-2">{s.intro}</p>

      <table className="mt-3 w-full border-collapse border border-ink text-sm">
        <tbody>
          {s.particulars.map(([k, v]) => (
            <tr key={k} className="border-b border-ink/70">
              <th
                scope="row"
                className="w-2/5 border-r border-ink/70 bg-ink/[0.04] px-2 py-1.5 text-left font-semibold"
              >
                {k}
              </th>
              <td className="px-2 py-1.5 tabular-nums">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-5 font-bold">{s.groundsLabel}</p>
      <ul className="mt-1 space-y-2">
        {s.grounds.map((g) => (
          <li
            key={g.n}
            className={`flex gap-2 border-b border-ink/30 pb-2 ${
              g.ticked ? "" : "text-ink/60"
            }`}
          >
            <span aria-hidden="true" className="font-mono">
              {g.ticked ? "[x]" : "[ ]"}
            </span>
            <span>
              {g.ticked && <span className="sr-only">Ticked: </span>}
              <span className="font-semibold">
                {g.n}. {g.title}
              </span>
              {g.text && <span className="mt-0.5 block">{g.text}</span>}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-5 font-bold">{s.actionLabel}</p>
      <p className="mt-1">{s.action}</p>
      <p className="mt-3">{s.closing}</p>

      <div className="mt-6 sm:ml-auto sm:w-72">
        <p>{s.yours}</p>
        <div className="mt-8">
          {s.sign.map((l) => (
            <p key={l}>{l}</p>
          ))}
        </div>
      </div>

      <div className="mt-6 border-t border-ink pt-2 text-sm">
        <p>{s.encl}</p>
        <p className="mt-1">{s.copyLabel}</p>
        {s.copies.map((c) => (
          <p key={c}>{c}</p>
        ))}
      </div>
    </>
  );
}
