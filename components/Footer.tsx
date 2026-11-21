"use client";

import { usePrefs } from "@/lib/prefs";

export default function Footer() {
  const { t } = usePrefs();
  return (
    <footer className="mt-12 border-t-4 border-double border-ink">
      <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-ink/80">
        {t("footer")}
      </p>
    </footer>
  );
}
