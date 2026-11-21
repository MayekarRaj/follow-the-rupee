"use client";

import { useEffect, useRef } from "react";
import { usePrefs } from "@/lib/prefs";

const FOCUSABLE =
  'a[href],button:not([disabled]),select,textarea,input,[tabindex]:not([tabindex="-1"])';

/**
 * Modal drawer: focus moves in, Tab is trapped, Esc closes, focus returns
 * to whatever opened it. Bottom sheet on mobile, right panel on desktop.
 */
export default function Drawer({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { t } = usePrefs();
  const ref = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const el = ref.current;
    el?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !el) return;
      const items = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === el)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-stretch sm:justify-end">
      <button
        tabIndex={-1}
        aria-hidden="true"
        className="absolute inset-0 bg-ink/50"
        onClick={onClose}
      />
      <aside
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="relative max-h-[88vh] w-full overflow-y-auto border-t-[6px] border-road bg-paper p-4 focus:outline-none sm:max-h-none sm:w-[30rem] sm:border-l-4 sm:border-t-0 sm:border-ink"
      >
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="min-h-11 min-w-11 border border-ink px-3 text-sm font-semibold text-ink hover:bg-road/25"
          >
            {t("close")}
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}
