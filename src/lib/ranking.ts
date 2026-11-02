import type { Activity } from "./types";

/** A place gets its own rank once it has this many approved reviews. */
export const MIN_REVIEWS_FOR_RANK = 3;

// Every place counts as if it already had a few middling reviews, so a handful of 5-star
// ratings does not beat a place that many families rate highly.
const STARTING_RATING = 4;
const STARTING_REVIEWS = 5;

/** The approved reviews of one activity. */
export interface RatingTotal {
  /** All ratings added up. */
  sum: number;
  count: number;
}

export interface RankedActivity {
  activity: Activity;
  /** Missing until the place has its first approved review. */
  total?: RatingTotal;
}

export interface Ranking {
  /** Best first; a place's rank is its position plus one. */
  ranked: RankedActivity[];
  /** Places with too few reviews for a rank, in alphabetical order. They all share the next spot. */
  unranked: RankedActivity[];
  /** The rank the unranked places share. */
  sharedRank: number;
}

/** What decides the order; visitors see the real average instead. */
export function rankingScore({ sum, count }: RatingTotal): number {
  return (STARTING_RATING * STARTING_REVIEWS + sum) / (STARTING_REVIEWS + count);
}

/** The average to show, rounded to one decimal. */
export function averageRating({ sum, count }: RatingTotal): number {
  return Math.round((sum / count) * 10) / 10;
}

/** Orders activities by their ratings. Equal scores go to the place with more reviews, then alphabetically. */
export function rankActivities(activities: Activity[], totals: Record<string, RatingTotal>, locale: string): Ranking {
  const all = activities.map((activity): RankedActivity => ({ activity, total: totals[activity.id] }));
  const byTitle = (a: RankedActivity, b: RankedActivity) => a.activity.title.localeCompare(b.activity.title, locale);
  const hasRank = ({ total }: RankedActivity) => !!total && total.count >= MIN_REVIEWS_FOR_RANK;

  const ranked = all
    .filter(hasRank)
    .sort((a, b) => rankingScore(b.total!) - rankingScore(a.total!) || b.total!.count - a.total!.count || byTitle(a, b));
  const unranked = all.filter((entry) => !hasRank(entry)).sort(byTitle);
  return { ranked, unranked, sharedRank: ranked.length + 1 };
}
