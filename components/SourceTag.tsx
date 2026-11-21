"use client";

import { usePrefs } from "@/lib/prefs";
import { SOURCE } from "@/lib/sources";

/** Small "Source: …" tag. The system name is a proper noun, so it stays English. */
export default function SourceTag({
  of,
  extra,
}: {
  of: keyof typeof SOURCE;
  /** A second source for the same item. */
  extra?: keyof typeof SOURCE;
}) {
  const { t } = usePrefs();
  const names = [of, ...(extra ? [extra] : [])].map((k) => SOURCE[k]).join(" + ");
  return (
    <span className="inline-flex items-baseline gap-1 whitespace-nowrap border border-ink/40 px-1.5 py-px align-middle text-[0.7rem] font-medium leading-snug text-ink/80">
      <span>{t("src.label")}</span>
      <span lang="en">{names}</span>
    </span>
  );
}
