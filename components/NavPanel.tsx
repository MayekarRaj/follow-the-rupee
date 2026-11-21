"use client";

import Link from "next/link";
import { usePrefs } from "@/lib/prefs";
import { useRole } from "@/lib/role";
import { createStore } from "@/lib/store";
import type { Role } from "@/lib/data";
import Drawer from "./Drawer";
import { IconCity, IconFlag, IconHelp, IconSearch, IconSidebar } from "./icons";
import { useSyncExternalStore } from "react";

const ITEMS: { role: Role; icon: React.ReactNode }[] = [
  { role: "commissioner", icon: <IconCity /> },
  { role: "ward", icon: <IconFlag /> },
  { role: "citizen", icon: <IconSearch /> },
];

const KEY: { k: "red" | "orange" | "yellow" | "green" | "ink"; swatch: string }[] = [
  { k: "red", swatch: "bg-stamp" },
  { k: "orange", swatch: "bg-hazard" },
  { k: "yellow", swatch: "bg-road" },
  { k: "green", swatch: "bg-ok" },
  { k: "ink", swatch: "bg-ink" },
];

// Sidebar collapsed state, kept in localStorage ("1" = icon rail).
const railStore = createStore("ftr.sidebar.v1");
function useCollapsed() {
  const raw = useSyncExternalStore(railStore.subscribe, railStore.get, () => "");
  return {
    collapsed: raw === "1",
    toggle: () => railStore.set(railStore.get() === "1" ? "0" : "1"),
  };
}

const itemBase =
  "flex min-h-14 w-full items-start gap-3 border-l-4 px-3 py-2.5 text-left";
const itemRail = "min-h-12 items-center justify-center px-0 py-0";
const itemIdle =
  "border-transparent text-ink hover:bg-road/20";
const itemActive = "border-stamp bg-road/35 text-ink";

/** Brand, role navigation, "How we flag" and the colour key. */
function NavBody({
  onNavigate,
  collapsed = false,
  onToggle,
}: {
  onNavigate?: () => void;
  /** Icon rail: icons only, names in tooltips and aria-labels. */
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const { t, setHowOpen } = usePrefs();
  const { role, ward } = useRole();

  const href = (r: Role) =>
    r === "ward" ? `/?role=ward&ward=${encodeURIComponent(ward)}` : `/?role=${r}`;

  return (
    <div className="flex h-full flex-col">
      <div
        className={`flex items-start gap-2 pb-3 pt-3 ${collapsed ? "justify-center px-0" : "px-4"}`}
      >
        {!collapsed && (
          <div className="min-w-0 flex-1 pt-1">
            <p className="font-sans text-xl font-bold leading-tight tracking-tight text-ink">
              Follow the Rupee
            </p>
            <p className="mt-0.5 text-xs leading-snug text-ink/75">{t("ledger")}</p>
          </div>
        )}
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={!collapsed}
            aria-label={collapsed ? t("nav.expand") : t("nav.collapse")}
            title={collapsed ? t("nav.expand") : t("nav.collapse")}
            className="flex h-11 w-11 shrink-0 items-center justify-center border border-ink text-ink hover:bg-road/25"
          >
            <IconSidebar />
          </button>
        )}
      </div>

      <nav aria-label={t("nav.label")} className="mt-1 border-t border-ink/30 py-2">
        <ul>
          {ITEMS.map(({ role: r, icon }) => {
            const active = r === role;
            return (
              <li key={r}>
                <Link
                  href={href(r)}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  aria-label={collapsed ? t(`role.${r}`) : undefined}
                  title={collapsed ? t(`role.${r}`) : undefined}
                  className={`${itemBase} ${collapsed ? itemRail : ""} ${active ? itemActive : itemIdle}`}
                >
                  <span className={collapsed ? "shrink-0" : "mt-0.5 shrink-0"}>{icon}</span>
                  <span className={collapsed ? "hidden" : ""}>
                    <span className="block text-sm font-semibold leading-tight">
                      {t(`role.${r}`)}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-ink/75">
                      {t(`nav.${r}`)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
          <li className="mt-1 border-t border-ink/20 pt-1">
            <button
              type="button"
              onClick={() => {
                onNavigate?.();
                setHowOpen(true);
              }}
              aria-label={collapsed ? t("how") : undefined}
              title={collapsed ? t("how") : undefined}
              className={`${itemBase} ${collapsed ? itemRail : ""} ${itemIdle}`}
            >
              <span className={collapsed ? "shrink-0" : "mt-0.5 shrink-0"}>
                <IconHelp />
              </span>
              <span className={collapsed ? "hidden" : ""}>
                <span className="block text-sm font-semibold leading-tight">
                  {t("how")}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-ink/75">
                  {t("nav.how")}
                </span>
              </span>
            </button>
          </li>
        </ul>
      </nav>

      <section
        aria-labelledby="colour-key"
        className={`mt-auto border-t border-ink/30 py-4 ${collapsed ? "px-0" : "px-4"}`}
      >
        <h2
          id="colour-key"
          className={`${collapsed ? "sr-only" : ""} text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink/75`}
        >
          {t("key.title")}
        </h2>
        <ul className={`mt-2 space-y-2 ${collapsed ? "flex flex-col items-center" : ""}`}>
          {KEY.map(({ k, swatch }) => (
            <li
              key={k}
              title={collapsed ? t(`key.${k}`) : undefined}
              className="flex items-start gap-2.5 text-xs leading-snug text-ink"
            >
              <span
                aria-hidden="true"
                className={`mt-0.5 h-3.5 w-3.5 shrink-0 border border-ink ${swatch}`}
              />
              <span className={collapsed ? "sr-only" : ""}>{t(`key.${k}`)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** Left rail, large screens only: 240px, or a 64px icon rail when collapsed. */
export function Sidebar() {
  const { collapsed, toggle } = useCollapsed();
  return (
    <aside
      className={`hidden shrink-0 border-r-2 border-ink bg-paper lg:sticky lg:top-0 lg:block lg:h-screen lg:self-start lg:overflow-y-auto ${collapsed ? "w-16" : "w-60"}`}
    >
      <div className="hazard-band" aria-hidden="true" />
      <NavBody collapsed={collapsed} onToggle={toggle} />
    </aside>
  );
}

/** The same panel as a left drawer on small screens. */
export function NavDrawerHost() {
  const { navOpen, setNavOpen, t } = usePrefs();
  if (!navOpen) return null;
  return (
    <Drawer side="left" label={t("menu")} onClose={() => setNavOpen(false)}>
      <NavBody onNavigate={() => setNavOpen(false)} />
    </Drawer>
  );
}
