import type { FlagType } from "@/lib/data";

export type StampKind = "review" | "twice" | "dlp";

export function stampFor(flag: FlagType): StampKind {
  if (flag === "DUPLICATE_BILL") return "twice";
  if (flag === "DLP_PAID") return "dlp";
  return "review";
}

const TEXT: Record<StampKind, string> = {
  review: "Needs review",
  twice: "Paid twice?",
  dlp: "DLP · ₹0 to BMC",
};

const TONE: Record<StampKind, string> = {
  review: "border-stamp text-stamp",
  twice: "border-stamp text-stamp border-double border-4 !py-0",
  dlp: "border-ok text-ok",
};

function Icon({ kind }: { kind: StampKind }) {
  const common = {
    width: 14,
    height: 14,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (kind === "twice")
    return (
      <svg {...common}>
        <rect x="5" y="5" width="9" height="9" rx="1" />
        <path d="M11 2H3a1 1 0 0 0-1 1v8" />
      </svg>
    );
  if (kind === "dlp")
    return (
      <svg {...common}>
        <path d="M8 1.5 13.5 3.5v4c0 3-2.2 5.4-5.5 7-3.3-1.6-5.5-4-5.5-7v-4z" />
        <path d="m5.5 8 2 2 3-3.5" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M8 2 14.5 13.5h-13z" />
      <path d="M8 6.5v3.5M8 12v.01" />
    </svg>
  );
}

/** Rubber-stamp badge: text + icon, never colour alone. */
export default function Stamp({
  kind,
  animate = false,
  small = false,
  className = "",
}: {
  kind: StampKind;
  animate?: boolean;
  small?: boolean;
  className?: string;
}) {
  return (
    <span
      lang="en"
      className={`inline-flex -rotate-3 select-none items-center border-2 font-bold uppercase leading-tight ${
        small
          ? "gap-1 px-1.5 text-[0.6rem] tracking-[0.1em]"
          : "gap-1.5 px-2 py-0.5 text-[0.7rem] tracking-[0.14em]"
      } ${TONE[kind]} ${animate ? "stamp-thud" : ""} ${className}`}
    >
      <Icon kind={kind} />
      {TEXT[kind]}
    </span>
  );
}
