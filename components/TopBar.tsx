"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useData, type Ward } from "@/lib/data";
import { usePrefs, type Scale } from "@/lib/prefs";
import { useRole } from "@/lib/role";
import type { Lang } from "@/lib/i18n";
import { IconChevron, IconMenu } from "./icons";

const SIZES: { s: Scale; label: string; key: "textSmaller" | "textNormal" | "textLarger" }[] = [
  { s: 90, label: "A−", key: "textSmaller" },
  { s: 100, label: "A", key: "textNormal" },
  { s: 120, label: "A+", key: "textLarger" },
];

const LANGS: { l: Lang; label: string; name: string }[] = [
  { l: "en", label: "EN", name: "English" },
  { l: "mr", label: "मर", name: "मराठी" },
  { l: "hi", label: "हि", name: "हिंदी" },
];

/** One segmented control: shared border, 44px targets, selected = filled ink. */
function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { v: T; text: string; aria: string; lang?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex">
      {options.map((o) => {
        const on = o.v === value;
        return (
          <button
            key={String(o.v)}
            type="button"
            onClick={() => onChange(o.v)}
            aria-pressed={on}
            aria-label={o.aria}
            lang={o.lang}
            className={`-ml-px min-h-11 min-w-11 border border-ink px-3 text-sm font-semibold first:ml-0 ${
              on ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-road/25"
            }`}
          >
            {o.text}
          </button>
        );
      })}
    </div>
  );
}

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const { role, ward } = useRole();
  const onFits = pathname === "/fits-bmc";
  const { data: wards } = useData<Ward[]>("wards.json");
  const { t, lang, setLang, scale, setScale, setNavOpen } = usePrefs();
  const ref = useRef<HTMLElement>(null);

  // Publish the bar height so sticky columns inside views can sit below it.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = () =>
      document.documentElement.style.setProperty("--header-h", `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function setWard(code: string) {
    const q = new URLSearchParams(sp.toString());
    q.set("role", "ward");
    q.set("ward", code);
    router.replace(`${pathname}?${q.toString()}`);
  }

  return (
    <header
      ref={ref}
      className="z-30 border-b-2 border-ink bg-paper lg:sticky lg:top-0"
    >
      <div className="hazard-band" aria-hidden="true" />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 sm:flex-nowrap">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label={t("menu")}
            className="inline-flex min-h-11 min-w-11 items-center justify-center border border-ink text-ink hover:bg-road/25 lg:hidden"
          >
            <IconMenu />
          </button>
          <p className="min-w-0 truncate text-lg font-bold leading-tight text-ink">
            {onFits ? t("fits.name") : t(`role.${role}`)}
          </p>
          {!onFits && role === "ward" && (
            <label className="ml-auto flex items-center gap-2 text-sm text-ink/80 sm:ml-3">
              <span>{t("ward")}</span>
              <span className="relative inline-flex">
                <select
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  className="min-h-11 appearance-none rounded-none border border-ink bg-paper py-1 pl-3 pr-9 text-sm font-semibold text-ink"
                >
                  {(wards ?? [{ ward_code: ward, ward_name: "" } as Ward]).map((w) => (
                    <option key={w.ward_code} value={w.ward_code}>
                      {w.ward_code}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-ink">
                  <IconChevron />
                </span>
              </span>
            </label>
          )}
        </div>

        <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
          <Segmented
            label={t("textSize")}
            value={scale}
            onChange={setScale}
            options={SIZES.map((z) => ({ v: z.s, text: z.label, aria: t(z.key) }))}
          />
          <Segmented
            label={t("language")}
            value={lang}
            onChange={setLang}
            options={LANGS.map((x) => ({ v: x.l, text: x.label, aria: x.name, lang: x.l }))}
          />
        </div>
      </div>
    </header>
  );
}
