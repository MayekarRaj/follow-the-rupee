"use client";

/**
 * Tiny localStorage-backed external store for useSyncExternalStore.
 * Falls back to memory if storage is blocked, so the UI still works.
 */
export const STORE_EVENT = "ftr:store";

export function createStore(key: string) {
  let mem: string | null = null;

  const get = (): string => {
    if (mem !== null) return mem;
    try {
      return localStorage.getItem(key) ?? "";
    } catch {
      return "";
    }
  };

  const subscribe = (cb: () => void) => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        mem = null;
        cb();
      }
    };
    // Same-tab writes: every open view hears this, whichever role it shows.
    const onLocal = (e: Event) => {
      if ((e as CustomEvent<{ key: string }>).detail?.key === key) cb();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(STORE_EVENT, onLocal);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(STORE_EVENT, onLocal);
    };
  };

  const set = (value: string) => {
    mem = value;
    try {
      localStorage.setItem(key, value);
    } catch {
      /* storage blocked: memory copy keeps this tab working */
    }
    window.dispatchEvent(new CustomEvent(STORE_EVENT, { detail: { key } }));
  };

  return { get, set, subscribe };
}
