// Landmark illustrations for the map's city badges, drawn in a 24×24 box centred on (12, 12).

export type LandmarkIcon =
  | "sebilj"
  | "tower"
  | "lake"
  | "factory"
  | "bridge"
  | "waterfall"
  | "wheat"
  | "cityHall"
  | "fortress"
  | "mountain"
  | "grapes"
  | "mosque"
  | "brokenBridge"
  | "raft"
  | "forest"
  | "watermill"
  | "spring";

// Image files under /public/landmarks.
const images: Record<LandmarkIcon, string> = {
  sebilj: "sebilj", // Sarajevo
  tower: "tvrdjava-kastel", // Banja Luka
  lake: "panonska-jezera", // Tuzla
  factory: "zeljezara", // Zenica
  bridge: "stari-most", // Mostar
  waterfall: "rijeka-una", // Bihać
  wheat: "semberija", // Bijeljina
  cityHall: "gradska-vijecnica", // Brčko
  fortress: "tvrdjava-gradina", // Doboj
  mountain: "kozara", // Prijedor
  grapes: "vinogradi", // Trebinje
  mosque: "sarena-dzamija", // Travnik
  brokenBridge: "most-na-neretvi", // Jablanica
  raft: "rafting-na-neretvi", // Konjic
  forest: "koprivnica", // Bugojno
  watermill: "mlincici-na-plivi", // Jajce
  spring: "banja-guber", // Srebrenica
};

/** One illustration, drawn in the 24×24 box at the current origin. */
export default function Landmark({ icon }: { icon: LandmarkIcon }) {
  // Slightly smaller than the box so the corners of the pictures stay inside the round badge.
  return <image href={`/landmarks/${images[icon]}.png`} x={1} y={1} width={22} height={22} />;
}
