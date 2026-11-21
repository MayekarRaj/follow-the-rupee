"use client";

import { usePrefs } from "@/lib/prefs";

export default function SkipLink() {
  const { t } = usePrefs();
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[60] focus:border-2 focus:border-ink focus:bg-road focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-ink"
    >
      {t("skip")}
    </a>
  );
}
