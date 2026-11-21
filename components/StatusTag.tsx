"use client";

import type { Status } from "@/lib/status";
import { usePrefs } from "@/lib/prefs";

const STYLE: Record<Status, { cls: string; icon: string }> = {
  new: { cls: "border-ink text-ink", icon: "○" },
  review: { cls: "border-ink bg-road text-ink", icon: "◐" },
  contested: { cls: "border-hazard bg-hazard/10 text-ink", icon: "⚑" },
  recovered: { cls: "border-ok bg-ok/10 text-ok", icon: "✓" },
  dismissed: { cls: "border-ink/60 text-ink/70", icon: "✕" },
};

/** Status as a tag: icon + word, never colour alone. */
export default function StatusTag({ status }: { status: Status }) {
  const { t } = usePrefs();
  const s = STYLE[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 border px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.1em] ${s.cls}`}
    >
      <span aria-hidden="true">{s.icon}</span>
      {t(`status.${status}`)}
    </span>
  );
}
