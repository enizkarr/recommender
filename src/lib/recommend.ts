import type { Activity, Budget, Preferences } from "./types";

const budgetRank: Record<Budget, number> = { free: 0, low: 1, medium: 2, high: 3 };

/** Returns activities that fit the preferences, best matches first. */
export function recommend(activities: Activity[], prefs: Preferences): Activity[] {
  return activities
    .filter(
      (a) =>
        prefs.childAge >= a.minAge &&
        budgetRank[a.budget] <= budgetRank[prefs.budget] &&
        a.durationHours <= prefs.hours &&
        (prefs.setting === "either" || a.setting === prefs.setting),
    )
    .sort((a, b) => b.durationHours - a.durationHours);
}
