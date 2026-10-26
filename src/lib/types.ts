export type Place = "nature" | "city";
export type Distance = "near" | "far";
export type Cost = "free" | "moderate" | "expensive";
export type Budget = "free" | "moderate" | "any";

/** "any" means the filter is not applied. */
export type Choice<T> = T | "any";

export interface Activity {
  id: string;
  title: string;
  description: string;
  place: Place;
  coffee: boolean;
  distance: Distance;
  cost: Cost;
  minAge: number;
  durationHours: number;
  tags: string[];
  location: string;
  /** Short practical note shown on the card: prices, hours, tips. */
  info: string;
  website?: string;
  /** Path under /public. Cards without an image show a coloured placeholder. */
  image?: string;
  /** Required attribution for Creative Commons photos. */
  imageCredit?: { author: string; license: string; source: string };
}

export interface Preferences {
  place: Choice<Place>;
  coffee: Choice<"yes" | "no">;
  distance: Choice<Distance>;
  budget: Budget;
}
