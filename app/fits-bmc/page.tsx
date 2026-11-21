import type { Metadata } from "next";

export const metadata: Metadata = { title: "Fits BMC · Follow the Rupee" };

/* Static page: how the audit layer sits beside BMC's existing systems.
   The diagram is plain HTML (real text, readable in order); the arrows are
   decorative SVG, and "In words" below repeats the same flow as a paragraph. */

const INPUTS: { name: string; note: string }[] = [
  {
    name: "Complaints in",
    note: "CCRS · MyBMC app · 1916 · MyBMC Assist WhatsApp",
  },
  { name: "Pothole Tracking System", note: "Repair and fix records" },
  { name: "SAP work orders", note: "What was billed, to which contractor" },
  { name: "USOR", note: "Rate schedule: what the work should cost" },
];

const OUTPUTS: { name: string; note: string }[] = [
  { name: "Ward officer queue", note: "Items that need review, in order" },
  {
    name: "Escalation note in BMC office-note format",
    note: "Drafted for the officer to edit and send",
  },
  {
    name: "Complaint status API for MyBMC Assist",
    note: "A citizen asks, the trail comes back",
  },
  { name: "Commissioner budget review", note: "Spend and under-use by ward" },
];

const PRINCIPLES = [
  "We don't replace any BMC system",
  "Reads exports BMC already has",
  "Answers flow back through existing channels",
];

/** Decorative arrow: points right on wide screens, down when stacked. */
function Arrow() {
  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-center py-1 lg:px-1 lg:py-0"
    >
      <svg
        width="40"
        height="28"
        viewBox="0 0 40 28"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="rotate-90 text-ink lg:rotate-0"
      >
        <path d="M3 14h32M26 5l9 9-9 9" />
      </svg>
    </div>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink/75">
      {children}
    </p>
  );
}

export default function FitsBmcPage() {
  return (
    <main
      id="main"
      tabIndex={-1}
      lang="en"
      className="mx-auto max-w-7xl px-4 py-6 sm:px-6"
    >
      <h1 className="font-sans text-4xl font-bold leading-tight text-ink">
        How it fits BMC
      </h1>
      <p className="mt-2 max-w-[60ch] text-base text-ink/85">
        A proposal, not a live connection. This prototype runs on synthetic data
        that stands in for the exports shown on the left.
      </p>

      <figure
        aria-labelledby="fits-cap"
        className="mt-8 border-t-2 border-ink pt-6"
      >
        <div className="grid items-stretch gap-2 lg:grid-cols-[1fr_auto_1.1fr_auto_1fr]">
          {/* 1. BMC systems, unchanged */}
          <section aria-labelledby="col-in">
            <Caption>
              <span id="col-in">BMC systems today · unchanged</span>
            </Caption>
            <ul className="mt-2 space-y-2">
              {INPUTS.map((i) => (
                <li key={i.name} className="border-2 border-ink bg-paper p-3">
                  <p className="text-base font-bold text-ink">{i.name}</p>
                  <p className="mt-0.5 text-sm text-ink/80">{i.note}</p>
                </li>
              ))}
            </ul>
          </section>

          <Arrow />

          {/* 2. The audit layer */}
          <section
            aria-labelledby="col-mid"
            className="flex flex-col"
          >
            <Caption>
              <span id="col-mid">New · the audit layer</span>
            </Caption>
            <div className="mt-2 flex flex-1 flex-col justify-center border-2 border-ink bg-ink p-4 text-paper">
              <h2 className="font-sans text-2xl font-bold leading-tight">
                Follow the Rupee audit layer
              </h2>
              <div className="mt-4 border-t border-paper/40 pt-3">
                <p className="text-base font-bold">Deterministic engine</p>
                <p className="mt-0.5 text-sm text-paper/90">
                  Rules compare each bill with the rate schedule, earlier bills
                  and warranty. The same input always gives the same flags.
                </p>
              </div>
              <div className="mt-3 border-t border-paper/40 pt-3">
                <p className="text-base font-bold">Claude explanations</p>
                <p className="mt-0.5 text-sm text-paper/90">
                  Plain-language reasons in English, Marathi and Hindi. Claude
                  explains a flag; it does not decide one.
                </p>
              </div>
            </div>
          </section>

          <Arrow />

          {/* 3. Outputs */}
          <section aria-labelledby="col-out">
            <Caption>
              <span id="col-out">Outputs · back to BMC channels</span>
            </Caption>
            <ul className="mt-2 space-y-2">
              {OUTPUTS.map((o) => (
                <li
                  key={o.name}
                  className="border-2 border-ink border-l-8 border-l-road bg-paper p-3"
                >
                  <p className="text-base font-bold text-ink">{o.name}</p>
                  <p className="mt-0.5 text-sm text-ink/80">{o.note}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <figcaption id="fits-cap" className="mt-6 max-w-[75ch] text-sm text-ink/90">
          <span className="font-semibold">In words: </span>
          Four BMC sources feed in: complaints (from CCRS, the MyBMC app, 1916
          and MyBMC Assist on WhatsApp), the Pothole Tracking System, SAP work
          orders, and the USOR rate schedule. The Follow the Rupee audit layer, a
          deterministic engine plus Claude explanations, reads them. It produces
          four outputs: a ward officer queue, an escalation note in BMC
          office-note format, a complaint status API for MyBMC Assist, and a
          Commissioner budget review.
        </figcaption>
      </figure>

      <h2 className="mt-10 border-b-2 border-ink pb-1 font-sans text-xl font-bold text-ink">
        What this means for BMC
      </h2>
      <ul className="mt-1">
        {PRINCIPLES.map((p, i) => (
          <li
            key={p}
            className="flex items-baseline gap-3 border-b border-ink/40 py-3"
          >
            <span
              aria-hidden="true"
              className="w-6 font-serif text-xl font-bold tabular-nums text-ink"
            >
              {i + 1}
            </span>
            <span className="text-lg font-semibold text-ink">{p}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
