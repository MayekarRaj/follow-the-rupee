"use client";

/**
 * Tiny localStorage-backed external store for useSyncExternalStore.
 * Falls back to memory if storage is blocked, so the UI still works.
 */
export function createStore(key: string) {
  const listeners = new Set<() => void>();
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
    listeners.add(cb);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        mem = null;
        cb();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(cb);
      window.removeEventListener("storage", onStorage);
    };
  };

  const set = (value: string) => {
    mem = value;
    try {
      localStorage.setItem(key, value);
    } catch {
      /* storage blocked: memory copy keeps this tab working */
    }
    listeners.forEach((l) => l());
  };

  return { get, set, subscribe };
}
