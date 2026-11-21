"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { createStore } from "./store";
import { tr, type Key, type Lang, type Vars } from "./i18n";

export type Scale = 90 | 100 | 120;
const store = createStore("ftr.prefs.v1");

function parse(raw: string): { lang: Lang; scale: Scale } {
  const out: { lang: Lang; scale: Scale } = { lang: "en", scale: 100 };
  try {
    const o = JSON.parse(raw);
    if (o.lang === "mr" || o.lang === "hi" || o.lang === "en") out.lang = o.lang;
    if (o.scale === 90 || o.scale === 100 || o.scale === 120) out.scale = o.scale;
  } catch {
    /* defaults */
  }
  return out;
}

/**
 * The stored preference is read by every consumer itself (not handed down
 * from the provider). A component that hydrates late — e.g. inside a
 * Suspense boundary — then still starts from the server snapshot (English)
 * and matches the server HTML, instead of seeing an already-updated context.
 */
function useStored() {
  const raw = useSyncExternalStore(store.subscribe, store.get, () => "");
  return useMemo(() => parse(raw), [raw]);
}

type Ctx = {
  howOpen: boolean;
  setHowOpen: (v: boolean) => void;
};

const UiCtx = createContext<Ctx | null>(null);

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const { lang, scale } = useStored();
  const [howOpen, setHowOpen] = useState(false);

  // Effects only run after hydration, so touching <html> here is safe.
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.style.fontSize = `${scale}%`;
  }, [lang, scale]);

  const value = useMemo(() => ({ howOpen, setHowOpen }), [howOpen]);
  return <UiCtx.Provider value={value}>{children}</UiCtx.Provider>;
}

export function usePrefs() {
  const ui = useContext(UiCtx);
  if (!ui) throw new Error("usePrefs must be used inside PrefsProvider");
  const { lang, scale } = useStored();

  const setLang = useCallback(
    (l: Lang) => store.set(JSON.stringify({ ...parse(store.get()), lang: l })),
    [],
  );
  const setScale = useCallback(
    (s: Scale) => store.set(JSON.stringify({ ...parse(store.get()), scale: s })),
    [],
  );
  const t = useCallback((k: Key, v?: Vars) => tr(lang, k, v), [lang]);

  return {
    lang,
    scale,
    /** lang attribute for untranslated (English) data text */
    dataLang: lang === "en" ? undefined : ("en" as string | undefined),
    setLang,
    setScale,
    t,
    howOpen: ui.howOpen,
    setHowOpen: ui.setHowOpen,
  };
}
