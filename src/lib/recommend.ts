import type { Activity, Budget, Cost, Preferences } from "./types";

const allowedCosts: Record<Budget, Cost[]> = {
  free: ["free"],
  moderate: ["free", "moderate"],
  any: ["free", "moderate", "expensive"],
};

/** Returns activities that fit the preferences, best matches first. */
export function recommend(activities: Activity[], prefs: Preferences): Activity[] {
  return activities
    .filter(
      (a) =>
        (prefs.place === "any" || a.place === prefs.place) &&
        (prefs.coffee === "any" || a.coffee === (prefs.coffee === "yes")) &&
        (prefs.setting === "any" || a.indoor === (prefs.setting === "indoor")) &&
        (prefs.distance === "any" || a.distance === prefs.distance) &&
        allowedCosts[prefs.budget].includes(a.cost),
    )
    .sort((a, b) => b.durationHours - a.durationHours);
}
