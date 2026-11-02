import { useMemo, useSyncExternalStore } from "react";

// Saved activity ids, oldest first. Kept in localStorage so they survive a reload. The in-memory
// copy also covers browsers where storage is blocked (the list then lasts until the page is closed).
const STORAGE_KEY = "family-time:favourites";
const listeners = new Set<() => void>();
let current: string | null | undefined;

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    // A null key means the whole storage was cleared.
    if (e.key !== null && e.key !== STORAGE_KEY) return;
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

function getSnapshot() {
  if (current === undefined) current = readStored();
  return current;
}

function parse(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function save(ids: string[]) {
  current = JSON.stringify(ids);
  try {
    localStorage.setItem(STORAGE_KEY, current);
  } catch {
    // Storage blocked: keep the in-memory copy only.
  }
  listeners.forEach((l) => l());
}

export function toggleFavourite(id: string) {
  const ids = parse(getSnapshot());
  save(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
}

/** Saves several activities at once, keeping the ones already saved. */
export function addFavourites(newIds: string[]) {
  save([...new Set([...parse(getSnapshot()), ...newIds])]);
}

/** The saved activity ids, oldest first; empty on the server and until the first one is saved. */
export function useFavourites(): string[] {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null);
  return useMemo(() => parse(raw), [raw]);
}
