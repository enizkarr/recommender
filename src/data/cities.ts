export interface City {
  name: string;
  /** [latitude, longitude] */
  coordinates: [number, number];
  /** Where the name sits relative to the dot; defaults to the right. */
  label?: "left" | "right" | "above" | "below";
  capital?: boolean;
}

// Largest cities, shown on the map for orientation.
export const cities: City[] = [
  // Below the dot so the name is not covered by the many activity dots around the city.
  { name: "Sarajevo", coordinates: [43.8563, 18.4131], label: "below", capital: true },
  { name: "Banja Luka", coordinates: [44.7722, 17.191] },
  { name: "Tuzla", coordinates: [44.5384, 18.6671] },
  { name: "Zenica", coordinates: [44.2034, 17.9077] },
  { name: "Mostar", coordinates: [43.3438, 17.8078] },
  { name: "Bihać", coordinates: [44.8169, 15.8708] },
  { name: "Bijeljina", coordinates: [44.757, 19.2144], label: "left" },
  { name: "Brčko", coordinates: [44.8727, 18.8106], label: "left" },
  { name: "Doboj", coordinates: [44.7349, 18.0843] },
  { name: "Prijedor", coordinates: [44.9799, 16.713] },
  // The southern tip is too narrow for a label beside the dot.
  { name: "Trebinje", coordinates: [42.7117, 18.3436], label: "above" },
];
