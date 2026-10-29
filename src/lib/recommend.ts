import type { Activity, Budget, Cost, Preferences } from "./types";

const allowedCosts: Record<Budget, Cost[]> = {
  free: ["free"],
  moderate: ["free", "moderate"],
  any: ["free", "moderate", "expensive"],
};

/**
 * Returns activities that fit the preferences, best matches first. The kilometre limit uses
 * `kmTo` (the distance from the starting point) and is skipped when no distance is known.
 */
export function recommend(activities: Activity[], prefs: Preferences, kmTo?: (a: Activity) => number | undefined): Activity[] {
  const withinLimit = (a: Activity) => {
    const km = prefs.radius === "any" ? undefined : kmTo?.(a);
    return km === undefined || km <= Number(prefs.radius);
  };
  return activities
    .filter(
      (a) =>
        (prefs.place === "any" || a.place === prefs.place) &&
        (prefs.coffee === "any" || a.coffee === (prefs.coffee === "yes")) &&
        (prefs.setting === "any" || a.indoor === (prefs.setting === "indoor")) &&
        (prefs.distance === "any" || a.distance === prefs.distance) &&
        allowedCosts[prefs.budget].includes(a.cost) &&
        withinLimit(a),
    )
    .sort((a, b) => b.durationHours - a.durationHours);
}

/** How far from a city an activity may be to count as "near" it. */
export const NEAR_CITY_KM = 40;

/** Straight-line distance in kilometres between two [latitude, longitude] points. */
export function distanceKm([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Whether an activity is within NEAR_CITY_KM of the given [latitude, longitude]. */
export function isNear(activity: Activity, coordinates: [number, number]): boolean {
  return distanceKm(activity.coordinates, coordinates) <= NEAR_CITY_KM;
}
