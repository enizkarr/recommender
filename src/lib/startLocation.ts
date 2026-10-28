import { useMemo, useSyncExternalStore } from "react";
import { cities } from "@/data/cities";
import { distanceKm } from "./recommend";

/** Where the family sets out from: a picked town, or the browser's location named after the nearest town. */
export interface StartLocation {
  name: string;
  /** [latitude, longitude] */
  coordinates: [number, number];
  source: "gps" | "city";
}

// Towns offered in the picker: the map cities plus other larger towns, so most families find theirs.
const extraTowns: { name: string; coordinates: [number, number] }[] = [
  { name: "Bosanska Krupa", coordinates: [44.8833, 16.15] },
  { name: "Cazin", coordinates: [44.9667, 15.9431] },
  { name: "Čapljina", coordinates: [43.1214, 17.6844] },
  { name: "Derventa", coordinates: [44.9781, 17.9078] },
  { name: "Foča", coordinates: [43.5064, 18.7781] },
  { name: "Goražde", coordinates: [43.6681, 18.9761] },
  { name: "Gornji Vakuf-Uskoplje", coordinates: [43.9381, 17.5883] },
  { name: "Gračanica", coordinates: [44.7036, 18.3083] },
  { name: "Gradiška", coordinates: [45.145, 17.25] },
  { name: "Kakanj", coordinates: [44.1328, 18.1222] },
  { name: "Kiseljak", coordinates: [43.9431, 18.0781] },
  { name: "Laktaši", coordinates: [44.9083, 17.3014] },
  { name: "Livno", coordinates: [43.8269, 17.0081] },
  { name: "Ljubuški", coordinates: [43.1969, 17.545] },
  { name: "Lukavac", coordinates: [44.5422, 18.5297] },
  { name: "Modriča", coordinates: [44.9575, 18.3036] },
  { name: "Mrkonjić Grad", coordinates: [44.4167, 17.0833] },
  { name: "Neum", coordinates: [42.9233, 17.6156] },
  { name: "Sanski Most", coordinates: [44.7667, 16.6667] },
  { name: "Široki Brijeg", coordinates: [43.3833, 17.5944] },
  { name: "Tešanj", coordinates: [44.6114, 17.9858] },
  { name: "Velika Kladuša", coordinates: [45.1842, 15.8058] },
  { name: "Visoko", coordinates: [43.9889, 18.1781] },
  { name: "Zavidovići", coordinates: [44.4458, 18.1497] },
  { name: "Zvornik", coordinates: [44.3858, 19.1028] },
];

// The Bosnian alphabet, with dž, lj and nj as single letters. Sorting by hand rather than with
// localeCompare("bs"): the server and the browser ship different collation data, and a different
// order on each side breaks hydration of the town list.
const ALPHABET = ["a", "b", "c", "č", "ć", "d", "dž", "đ", "e", "f", "g", "h", "i", "j", "k", "l", "lj", "m", "n", "nj", "o", "p", "r", "s", "š", "t", "u", "v", "z", "ž"];

/** A town name as positions in the alphabet; spaces and hyphens sort before every letter. */
function sortKey(name: string): number[] {
  const text = name.toLowerCase();
  const key: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const pair = text.slice(i, i + 2);
    if (ALPHABET.includes(pair) && pair.length === 2) {
      key.push(ALPHABET.indexOf(pair));
      i++;
    } else {
      key.push(ALPHABET.indexOf(text[i]));
    }
  }
  return key;
}

function compareNames(a: string, b: string): number {
  const ka = sortKey(a);
  const kb = sortKey(b);
  for (let i = 0; i < Math.min(ka.length, kb.length); i++) {
    if (ka[i] !== kb[i]) return ka[i] - kb[i];
  }
  return ka.length - kb.length;
}

export const towns = [...cities.map(({ name, coordinates }) => ({ name, coordinates })), ...extraTowns].sort((a, b) =>
  compareNames(a.name, b.name),
);

/** A browser location further than this from every town is taken to be outside the country. */
const OUTSIDE_BIH_KM = 50;

/** The town closest to a [latitude, longitude], or null when the point is outside BiH. */
export function nearestTown(coordinates: [number, number]) {
  let best = towns[0];
  for (const t of towns) {
    if (distanceKm(t.coordinates, coordinates) < distanceKm(best.coordinates, coordinates)) best = t;
  }
  return distanceKm(best.coordinates, coordinates) <= OUTSIDE_BIH_KM ? best : null;
}

/** "~45 km", rounded more coarsely the further away it is. */
export function formatKm(km: number): string {
  if (km < 1) return "manje od 1 km";
  return `~${km < 100 ? Math.round(km) : Math.round(km / 5) * 5} km`;
}

// Kept in localStorage so the choice survives a reload. The in-memory copy also covers
// browsers where storage is blocked (the choice then lasts until the page is closed).
const STORAGE_KEY = "family-time:start";
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
    if (e.key !== STORAGE_KEY) return;
    current = e.newValue;
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

function parse(raw: string | null): StartLocation | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as StartLocation;
    const [lat, lon] = value.coordinates;
    return typeof value.name === "string" && Number.isFinite(lat) && Number.isFinite(lon) ? value : null;
  } catch {
    return null;
  }
}

export function saveStartLocation(location: StartLocation | null) {
  current = location ? JSON.stringify(location) : null;
  try {
    if (current) localStorage.setItem(STORAGE_KEY, current);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: keep the in-memory copy only.
  }
  listeners.forEach((l) => l());
}

/** The saved starting point; null on the server and until one is chosen. */
export function useStartLocation(): StartLocation | null {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null);
  return useMemo(() => parse(raw), [raw]);
}
