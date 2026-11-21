"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_WARD, ROLES, useData, type Role, type Ward } from "@/lib/data";
import { usePrefs, type Scale } from "@/lib/prefs";
import type { Lang } from "@/lib/i18n";

export function useRole(): { role: Role; ward: string } {
  const sp = useSearchParams();
  const r = sp.get("role");
  const role: Role =
    r === "commissioner" || r === "citizen" || r === "ward" ? r : "ward";
  return { role, ward: sp.get("ward") || DEFAULT_WARD };
}

const SIZES: { s: Scale; label: string; key: "textSmaller" | "textNormal" | "textLarger" }[] = [
  { s: 90, label: "A−", key: "textSmaller" },
  { s: 100, label: "A", key: "textNormal" },
  { s: 120, label: "A+", key: "textLarger" },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const { role, ward } = useRole();
  const { data: wards } = useData<Ward[]>("wards.json");
  const { t, lang, setLang, scale, setScale, setHowOpen } = usePrefs();
  const ref = useRef<HTMLElement>(null);

  // Publish the header height so the sticky right column can sit below it.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = () =>
      document.documentElement.style.setProperty(
        "--header-h",
        `${el.offsetHeight}px`,
      );
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function update(next: Record<string, string | null>) {
    const q = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v == null) q.delete(k);
      else q.set(k, v);
    }
    router.replace(`${pathname}?${q.toString()}`);
  }

  const sel =
    "min-h-11 rounded-sm border border-ink bg-paper px-2 text-sm font-medium text-ink";
  const lbl = "flex items-center gap-2 text-sm text-ink/80";

  return (
    <header ref={ref} className="z-30 bg-paper lg:sticky lg:top-0">
      <div className="hazard-band" aria-hidden="true" />
      <div className="rule-double">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-ink/70">
              {t("ledger")}
            </p>
            <p className="font-serif text-2xl font-bold leading-none tracking-tight text-ink">
              Follow the Rupee
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 lg:ml-auto">
            <label className={lbl}>
              {t("viewAs")}
              <select
                className={sel}
                value={role}
                onChange={(e) =>
                  update({
                    role: e.target.value,
                    ward: e.target.value === "ward" ? ward : null,
                  })
                }
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {t(`role.${r.value}`)}
                  </option>
                ))}
              </select>
            </label>
            {role === "ward" && (
              <label className={lbl}>
                {t("ward")}
                <select
                  className={sel}
                  value={ward}
                  onChange={(e) =>
                    update({ role: "ward", ward: e.target.value })
                  }
                >
                  {(wards ?? [{ ward_code: ward, ward_name: "" } as Ward]).map(
                    (w) => (
                      <option key={w.ward_code} value={w.ward_code}>
                        {w.ward_code}
                      </option>
                    ),
                  )}
                </select>
              </label>
            )}
            <button
              onClick={() => setHowOpen(true)}
              className="min-h-11 border border-ink px-3 text-sm font-semibold text-ink underline underline-offset-4 hover:bg-road/25"
            >
              {t("how")}
            </button>
            <div
              role="group"
              aria-label={t("textSize")}
              className="flex"
            >
              {SIZES.map((z) => (
                <button
                  key={z.s}
                  onClick={() => setScale(z.s)}
                  aria-pressed={scale === z.s}
                  aria-label={t(z.key)}
                  className={`min-h-11 min-w-11 border border-ink px-2 font-serif text-base font-bold -ml-px first:ml-0 ${
                    scale === z.s ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-road/25"
                  }`}
                >
                  {z.label}
                </button>
              ))}
            </div>
            <label className={lbl}>
              <span>{t("language")}</span>
              <select
                className={sel}
                value={lang}
                onChange={(e) => setLang(e.target.value as Lang)}
              >
                <option value="en" lang="en">English</option>
                <option value="mr" lang="mr">मराठी</option>
                <option value="hi" lang="hi">हिंदी</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </header>
  );
}
