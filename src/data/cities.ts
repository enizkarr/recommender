import type { LandmarkIcon } from "@/components/Landmark";

export interface City {
  name: string;
  /** [latitude, longitude] */
  coordinates: [number, number];
  /** Where the name sits relative to the landmark badge; defaults to the right. */
  label?: "left" | "right" | "above" | "below";
  capital?: boolean;
  /** Pictogram drawn in the city's map badge. */
  icon: LandmarkIcon;
  /** What the pictogram shows, used for the hover tooltip. */
  landmark: string;
}

// Largest cities, shown on the map for orientation.
export const cities: City[] = [
  // Below so the name is not covered by the many activity dots around the city.
  { name: "Sarajevo", coordinates: [43.8563, 18.4131], label: "below", capital: true, icon: "sebilj", landmark: "Sebilj" },
  { name: "Banja Luka", coordinates: [44.7722, 17.191], icon: "tower", landmark: "Tvrđava Kastel" },
  { name: "Tuzla", coordinates: [44.5384, 18.6671], icon: "lake", landmark: "Panonska jezera" },
  { name: "Zenica", coordinates: [44.2034, 17.9077], icon: "factory", landmark: "Željezara" },
  { name: "Mostar", coordinates: [43.3438, 17.8078], icon: "bridge", landmark: "Stari most" },
  { name: "Bihać", coordinates: [44.8169, 15.8708], icon: "waterfall", landmark: "Rijeka Una" },
  { name: "Bijeljina", coordinates: [44.757, 19.2144], label: "left", icon: "wheat", landmark: "Semberija" },
  { name: "Brčko", coordinates: [44.8727, 18.8106], label: "left", icon: "cityHall", landmark: "Gradska vijećnica" },
  { name: "Doboj", coordinates: [44.7349, 18.0843], icon: "fortress", landmark: "Tvrđava Gradina" },
  { name: "Prijedor", coordinates: [44.9799, 16.713], icon: "mountain", landmark: "Kozara" },
  // The southern tip is too narrow for a label beside the badge.
  { name: "Trebinje", coordinates: [42.7117, 18.3436], label: "above", icon: "grapes", landmark: "Vinogradi" },
  { name: "Travnik", coordinates: [44.2264, 17.6658], label: "left", icon: "mosque", landmark: "Šarena džamija" },
  { name: "Jablanica", coordinates: [43.6602, 17.7616], label: "left", icon: "brokenBridge", landmark: "Most na Neretvi" },
  { name: "Konjic", coordinates: [43.6511, 17.9611], icon: "raft", landmark: "Rafting na Neretvi" },
  { name: "Bugojno", coordinates: [44.0572, 17.4508], label: "left", icon: "forest", landmark: "Koprivnica" },
  { name: "Jajce", coordinates: [44.342, 17.27], label: "left", icon: "watermill", landmark: "Mlinčići na Plivi" },
  { name: "Srebrenica", coordinates: [44.1064, 19.2981], label: "left", icon: "spring", landmark: "Banja Guber" },
];
