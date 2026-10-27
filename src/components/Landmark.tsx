// Tiny landmark pictograms for the map's city badges, drawn on a 24×24 grid centred on (12, 12).

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

const line = "fill-none stroke-zinc-700";
const solid = "stroke-zinc-700";

const icons: Record<LandmarkIcon, React.ReactNode> = {
  // Sarajevo: the wooden Sebilj fountain with its green copper dome
  sebilj: (
    <>
      <path d="M5 13 Q12 3.5 19 13 Z" className={`fill-emerald-300 ${solid}`} />
      <path d="M12 5 V2.5" className={line} />
      <rect x={6} y={13} width={12} height={7} className={`fill-amber-100 ${solid}`} />
      <path d="M10 14.5 V20 M14 14.5 V20" className={line} />
    </>
  ),
  // Banja Luka: Kastel's corner tower with its pointed roof
  tower: (
    <>
      <path d="M6.5 10 L12 3 L17.5 10 Z" className={`fill-zinc-500 ${solid}`} />
      <rect x={7.5} y={10} width={9} height={10} className={`fill-stone-200 ${solid}`} />
      <rect x={10.5} y={12.5} width={3} height={3} className={`fill-zinc-700 ${solid}`} />
    </>
  ),
  // Tuzla: the salt lakes in the sun
  lake: (
    <>
      <circle cx={16} cy={7.5} r={3.2} className={`fill-amber-300 ${solid}`} />
      <path d="M3 14 q2.25 -2 4.5 0 t4.5 0 t4.5 0 t4.5 0" className="fill-none stroke-sky-500" />
      <path d="M3 18.5 q2.25 -2 4.5 0 t4.5 0 t4.5 0 t4.5 0" className="fill-none stroke-sky-500" />
    </>
  ),
  // Zenica: the ironworks
  factory: (
    <>
      <circle cx={17} cy={3.2} r={1.6} className="fill-zinc-300" />
      <circle cx={19.8} cy={1.8} r={1.2} className="fill-zinc-300" />
      <rect x={15} y={5.5} width={4} height={14.5} className={`fill-rose-300 ${solid}`} />
      <path d="M3 20 V12 L8 15 V12 L13 15 V20 Z" className={`fill-stone-200 ${solid}`} />
    </>
  ),
  // Mostar: Stari most over the Neretva
  bridge: (
    <>
      <path d="M3 21 q2.25 -1.5 4.5 0 t4.5 0 t4.5 0 t4.5 0" className="fill-none stroke-sky-500" />
      <path d="M1.5 13 Q12 3 22.5 13 L22.5 15 Q12 6.5 1.5 15 Z" className={`fill-stone-200 ${solid}`} />
      <rect x={1} y={12.5} width={4} height={6.5} className={`fill-stone-300 ${solid}`} />
      <rect x={19} y={12.5} width={4} height={6.5} className={`fill-stone-300 ${solid}`} />
    </>
  ),
  // Bihać: the falls of the Una
  waterfall: (
    <>
      <path d="M2.5 8 H21.5" className={line} />
      <path d="M7 8 V17 M10.5 8 V18 M14 8 V17 M17.5 8 V18" className="fill-none stroke-sky-500" />
      <path d="M3 20.5 q2.25 -2 4.5 0 t4.5 0 t4.5 0 t4.5 0" className="fill-none stroke-sky-500" />
    </>
  ),
  // Bijeljina: the wheat fields of Semberija
  wheat: (
    <>
      <path d="M12 21 V5" className={line} />
      {[7, 10.5, 14].map((y) => (
        <g key={y}>
          <ellipse cx={9.4} cy={y} rx={2.6} ry={1.3} transform={`rotate(-35 9.4 ${y})`} className={`fill-amber-300 ${solid}`} />
          <ellipse cx={14.6} cy={y} rx={2.6} ry={1.3} transform={`rotate(35 14.6 ${y})`} className={`fill-amber-300 ${solid}`} />
        </g>
      ))}
    </>
  ),
  // Brčko: the city hall with its little dome
  cityHall: (
    <>
      <path d="M10 6.5 Q12 2.5 14 6.5 Z" className={`fill-rose-300 ${solid}`} />
      <rect x={10} y={6.5} width={4} height={5.5} className={`fill-amber-100 ${solid}`} />
      <rect x={3.5} y={12} width={17} height={8} className={`fill-amber-100 ${solid}`} />
      <path d="M10.5 20 V16.5 Q12 14.5 13.5 16.5 V20" className={`fill-zinc-700 ${solid}`} />
    </>
  ),
  // Doboj: the Gradina fortress walls
  fortress: (
    <>
      {[3.5, 8, 12.5, 17].map((x) => (
        <rect key={x} x={x} y={6.5} width={3.5} height={3.5} className={`fill-stone-300 ${solid}`} />
      ))}
      <rect x={3.5} y={10} width={17} height={10} className={`fill-stone-300 ${solid}`} />
      <path d="M10 20 V16 Q12 13.5 14 16 V20" className={`fill-zinc-700 ${solid}`} />
    </>
  ),
  // Prijedor: Kozara mountain
  mountain: (
    <>
      <path d="M1.5 20 L9 7 L13 13.5 L16 9.5 L22.5 20 Z" className={`fill-emerald-300 ${solid}`} />
      <path d="M7.3 10 L9 7 L10.7 10" className="fill-none stroke-white" />
    </>
  ),
  // Trebinje: the vineyards of Herzegovina
  grapes: (
    <>
      <path d="M12 6.5 V3.5" className={line} />
      <path d="M12 4.5 Q15 1.5 18 3.5 Q15 5.5 12 4.5 Z" className={`fill-emerald-400 ${solid}`} />
      {[
        [9.5, 9],
        [14.5, 9],
        [7, 13],
        [12, 13],
        [17, 13],
        [9.5, 17],
        [14.5, 17],
        [12, 20.5],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={2.3} className={`fill-violet-400 ${solid}`} />
      ))}
    </>
  ),
  // Travnik: Šarena džamija, the painted mosque
  mosque: (
    <>
      <rect x={18.8} y={5} width={2.6} height={15} className={`fill-stone-200 ${solid}`} />
      <path d="M18.6 5 L20.1 1.8 L21.6 5 Z" className={`fill-sky-300 ${solid}`} />
      <path d="M4 14 Q10.5 5.5 17 14 Z" className={`fill-sky-300 ${solid}`} />
      <rect x={3.5} y={14} width={14} height={6} className={`fill-amber-100 ${solid}`} />
      <path d="M9 20 V17 Q10.5 15.3 12 17 V20" className={`fill-zinc-700 ${solid}`} />
    </>
  ),
  // Jablanica: the broken railway bridge on the Neretva
  brokenBridge: (
    <>
      <path d="M2 21 q2.5 -1.5 5 0 t5 0 t5 0 t5 0" className="fill-none stroke-sky-500" />
      <rect x={3.5} y={10} width={2.5} height={9} className={`fill-stone-300 ${solid}`} />
      <rect x={18} y={10} width={2.5} height={9} className={`fill-stone-300 ${solid}`} />
      <rect x={1.5} y={8} width={9} height={2} className={`fill-zinc-500 ${solid}`} />
      <rect x={15} y={8} width={7.5} height={2} className={`fill-zinc-500 ${solid}`} />
      <path d="M10.5 8 L12.5 8 L16 18 L14 18 Z" className={`fill-zinc-500 ${solid}`} />
    </>
  ),
  // Konjic: rafting on the Neretva
  raft: (
    <>
      <path d="M15.5 4 L10.5 16" className={line} />
      <circle cx={8} cy={10.5} r={1.8} className={`fill-amber-200 ${solid}`} />
      <circle cx={13} cy={10.5} r={1.8} className={`fill-amber-200 ${solid}`} />
      <path d="M3 13.5 H21 Q20 17 16.5 17 H7.5 Q4 17 3 13.5 Z" className={`fill-orange-400 ${solid}`} />
      <path d="M2 20.5 q2.5 -1.5 5 0 t5 0 t5 0 t5 0" className="fill-none stroke-sky-500" />
    </>
  ),
  // Bugojno: the pine forests of Koprivnica
  forest: (
    <>
      <path d="M16.5 7 L12.5 14.5 H15 L12 20 H21 L18 14.5 H20.5 Z" className={`fill-emerald-300 ${solid}`} />
      <path d="M8.5 2.5 L3.5 12 H6.5 L2.5 18.5 H14.5 L10.5 12 H13.5 Z" className={`fill-emerald-500 ${solid}`} />
      <rect x={7.5} y={18.5} width={2} height={2.5} className={`fill-amber-700 ${solid}`} />
    </>
  ),
  // Jajce: the wooden watermills on the Pliva
  watermill: (
    <>
      <path d="M2.5 11 L8.5 5 L14.5 11 Z" className={`fill-amber-700 ${solid}`} />
      <rect x={3.5} y={11} width={10} height={6.5} className={`fill-amber-200 ${solid}`} />
      <circle cx={18} cy={14.5} r={3.8} className={`fill-none ${solid}`} />
      <path d="M18 10.7 V18.3 M14.2 14.5 H21.8" className={line} />
      <path d="M2 21 q2.5 -1.5 5 0 t5 0 t5 0 t5 0" className="fill-none stroke-sky-500" />
    </>
  ),
  // Srebrenica: the Guber mineral spring
  spring: (
    <>
      <path d="M12 2.5 C12 2.5 5.5 10.5 5.5 14.5 A6.5 6.5 0 0 0 18.5 14.5 C18.5 10.5 12 2.5 12 2.5 Z" className={`fill-sky-300 ${solid}`} />
      <path d="M9 14 A3 3 0 0 0 11.5 17.5" className="fill-none stroke-white" />
    </>
  ),
};

/** One pictogram, drawn in the 24×24 box at the current origin. */
export default function Landmark({ icon }: { icon: LandmarkIcon }) {
  return (
    <g strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
      {icons[icon]}
    </g>
  );
}
