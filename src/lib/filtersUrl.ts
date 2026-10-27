import type { Preferences } from "./types";

export const noFilters: Preferences = {
  place: "any",
  coffee: "any",
  setting: "any",
  distance: "any",
  budget: "any",
};

// URL parameter name and value for each filter, in Bosnian so shared links read naturally,
// e.g. ?mjesto=priroda&budzet=dzabe. Filters left at "any" are not written to the URL.
const params = {
  place: { name: "mjesto", values: { nature: "priroda", city: "grad" } },
  coffee: { name: "kafa", values: { yes: "da", no: "ne" } },
  setting: { name: "prostor", values: { indoor: "unutra", outdoor: "vani" } },
  distance: { name: "daljina", values: { near: "blizu", far: "daleko" } },
  budget: { name: "budzet", values: { free: "dzabe", moderate: "umjereno" } },
} as const;

type Key = keyof typeof params;
const keys = Object.keys(params) as Key[];

/** Query string for the given filters, without the leading "?"; empty when no filter is set. */
export function prefsToQuery(prefs: Preferences): string {
  const query = new URLSearchParams();
  for (const key of keys) {
    const values: Record<string, string> = params[key].values;
    const value = values[prefs[key]];
    if (value) query.set(params[key].name, value);
  }
  return query.toString();
}

/** Filters from the page's URL parameters, or null when the URL sets none. Unknown values are ignored. */
export function prefsFromQuery(query: Record<string, string | string[] | undefined>): Preferences | null {
  const prefs: Record<Key, string> = { ...noFilters };
  let found = false;
  for (const key of keys) {
    const raw = query[params[key].name];
    const value = Array.isArray(raw) ? raw[0] : raw;
    const match = Object.entries(params[key].values).find(([, v]) => v === value);
    if (match) {
      prefs[key] = match[0];
      found = true;
    }
  }
  return found ? (prefs as Preferences) : null;
}
