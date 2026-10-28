export type Place = "nature" | "city";
export type Setting = "indoor" | "outdoor";
export type Distance = "near" | "far";
export type Cost = "free" | "moderate" | "expensive";
export type Budget = "free" | "moderate" | "any";
/** Furthest an activity may be from the starting point, in kilometres. */
export type Radius = "30" | "60" | "120";

/** "any" means the filter is not applied. */
export type Choice<T> = T | "any";

export interface Activity {
  id: string;
  title: string;
  description: string;
  place: Place;
  coffee: boolean;
  /** Mostly under a roof, so it works on a rainy day. */
  indoor: boolean;
  distance: Distance;
  cost: Cost;
  minAge: number;
  durationHours: number;
  tags: string[];
  location: string;
  /** [latitude, longitude], used for the map marker. */
  coordinates: [number, number];
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
  setting: Choice<Setting>;
  distance: Choice<Distance>;
  budget: Budget;
  /** Only applied once a starting point is set. */
  radius: Choice<Radius>;
}
