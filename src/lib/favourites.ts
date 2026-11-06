import { useMemo } from "react";
import { storedValue } from "./storedValue";

// Saved activity ids, oldest first, as a JSON list in the browser.
const stored = storedValue("family-time:favourites");

function parse(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

const save = (ids: string[]) => stored.set(JSON.stringify(ids));

export function toggleFavourite(id: string) {
  const ids = parse(stored.get());
  save(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
}

/** Saves several activities at once, keeping the ones already saved. */
export function addFavourites(newIds: string[]) {
  save([...new Set([...parse(stored.get()), ...newIds])]);
}

/** The saved activity ids, oldest first; empty on the server and until the first one is saved. */
export function useFavourites(): string[] {
  const raw = stored.useValue();
  return useMemo(() => parse(raw), [raw]);
}
