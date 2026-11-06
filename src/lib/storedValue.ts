import { useSyncExternalStore } from "react";

/**
 * A text kept in localStorage under `key`, so it survives a reload, and shared live by every
 * component that reads it, in this tab and in other tabs. An in-memory copy covers browsers where
 * storage is blocked (the value then lasts until the page is closed).
 *
 * `fallback` is the value on the server (the page is prerendered) and when storage is blocked.
 */
export function storedValue(key: string, fallback: string | null = null) {
  const listeners = new Set<() => void>();
  // undefined until first read; afterwards the latest value, kept in step with other tabs.
  let current: string | null | undefined;

  function get(): string | null {
    if (current === undefined) {
      try {
        current = localStorage.getItem(key);
      } catch {
        current = fallback;
      }
    }
    return current;
  }

  function set(value: string | null) {
    current = value;
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {
      // Storage blocked: keep the in-memory copy only.
    }
    listeners.forEach((l) => l());
  }

  function subscribe(onChange: () => void) {
    const onStorage = (e: StorageEvent) => {
      // A null key means the whole storage was cleared.
      if (e.key !== null && e.key !== key) return;
      current = e.key === null ? null : e.newValue;
      onChange();
    };
    listeners.add(onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(onChange);
      window.removeEventListener("storage", onStorage);
    };
  }

  /** The current value; re-renders when it changes. */
  function useValue(): string | null {
    return useSyncExternalStore(subscribe, get, () => fallback);
  }

  return { get, set, useValue };
}
