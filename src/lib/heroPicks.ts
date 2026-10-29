import { useSyncExternalStore } from "react";
import type { Activity } from "./types";

/** How many activities the hero offers as thumbnails. */
export const HERO_SIZE = 3;

const sarajevoDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sarajevo", year: "numeric", month: "2-digit", day: "2-digit" });

/** The ISO week of a moment, counted in Sarajevo time, e.g. "2026-W44". */
export function weekKey(date: Date): string {
  const [y, m, d] = sarajevoDay.format(date).split("-").map(Number);
  // ISO weeks start on Monday, and week 1 is the one holding the year's first Thursday.
  const day = new Date(Date.UTC(y, m - 1, d));
  const weekday = day.getUTCDay() || 7;
  day.setUTCDate(day.getUTCDate() + 4 - weekday);
  const yearStart = Date.UTC(day.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((day.getTime() - yearStart) / 86400000 + 1) / 7);
  return `${day.getUTCFullYear()}-W${week}`;
}

/** Small seeded random generator (mulberry32), so a given week always gives the same picks. */
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * The week's featured activities: the same for everyone during a week, a new set the next week.
 * On a rainy day they come only from activities that are mostly under a roof.
 */
export function heroPicks(activities: Activity[], week: string, rainy: boolean): string[] {
  const pool = activities.filter((a) => a.image && (!rainy || a.indoor));
  const random = seededRandom(hash(rainy ? `${week}-kisa` : week));
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, HERO_SIZE).map((a) => a.id);
}

const noSubscription = () => () => {};

/**
 * The current week, read in the browser only: the page is prerendered, so the server must not
 * decide the week (it would be the week the site was built). Null until the page has hydrated.
 */
export function useWeekKey(): string | null {
  return useSyncExternalStore(noSubscription, () => weekKey(new Date()), () => null);
}
