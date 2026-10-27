import { bosniaBorder } from "@/data/bosniaBorder";
import { bosniaRoads } from "@/data/bosniaRoads";
import { cities, type City } from "@/data/cities";
import type { Activity } from "@/lib/types";

const lons = bosniaBorder.map(([lon]) => lon);
const lats = bosniaBorder.map(([, lat]) => lat);
const minLon = Math.min(...lons);
const maxLon = Math.max(...lons);
const minLat = Math.min(...lats);
const maxLat = Math.max(...lats);

// Simple equirectangular projection. Shrinking longitude by cos(latitude)
// keeps the country from looking stretched sideways.
const lonScale = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
const WIDTH = 1000;
const scale = WIDTH / ((maxLon - minLon) * lonScale);
const HEIGHT = (maxLat - minLat) * scale;
const PAD = 12; // room for the outline stroke at the edges
const VIEW_WIDTH = WIDTH + 2 * PAD;
const VIEW_HEIGHT = HEIGHT + 2 * PAD;

function project(lon: number, lat: number): [number, number] {
  return [(lon - minLon) * lonScale * scale, (maxLat - lat) * scale];
}

function toPath(points: [number, number][]): string {
  return "M" + points.map(([lon, lat]) => project(lon, lat).map((n) => n.toFixed(1)).join(",")).join("L");
}

const outline = toPath(bosniaBorder) + "Z";
const roads = bosniaRoads.map((r) => toPath(r.points));

// Most activities are around Sarajevo, too close together to tell apart at country scale,
// so this area is drawn again, zoomed in, in a box in the empty bottom-left corner.
const SARAJEVO = { minLon: 18.22, maxLon: 18.47, minLat: 43.8, maxLat: 43.9 };
const SARAJEVO_ASPECT = ((SARAJEVO.maxLon - SARAJEVO.minLon) * lonScale) / (SARAJEVO.maxLat - SARAJEVO.minLat);
const [boxLeft, boxTop] = project(SARAJEVO.minLon, SARAJEVO.maxLat);
const [boxRight, boxBottom] = project(SARAJEVO.maxLon, SARAJEVO.minLat);

function inSarajevo([lat, lon]: [number, number]): boolean {
  return lon >= SARAJEVO.minLon && lon <= SARAJEVO.maxLon && lat >= SARAJEVO.minLat && lat <= SARAJEVO.maxLat;
}

/** Position inside the Sarajevo box as fractions of its width and height. */
function insetPosition([lat, lon]: [number, number]): [number, number] {
  return [
    (lon - SARAJEVO.minLon) / (SARAJEVO.maxLon - SARAJEVO.minLon),
    (SARAJEVO.maxLat - lat) / (SARAJEVO.maxLat - SARAJEVO.minLat),
  ];
}

const labelPlacement: Record<NonNullable<City["label"]>, { dx: number; dy: number; anchor: "start" | "middle" | "end" }> = {
  right: { dx: 12, dy: 8, anchor: "start" },
  left: { dx: -12, dy: 8, anchor: "end" },
  above: { dx: 0, dy: -16, anchor: "middle" },
  below: { dx: 0, dy: 50, anchor: "middle" },
};

interface Props {
  activities: Activity[];
  /** Activities in the current results are drawn in colour, the others faded. */
  highlightedIds: string[];
  /** Activity whose card is hovered or that was picked on the map. */
  activeId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

interface DotProps {
  activity: Activity;
  highlighted: boolean;
  active: boolean;
  /** Position as fractions (0–1) of the containing box. */
  x: number;
  y: number;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

function Dot({ activity: a, highlighted, active, x, y, onSelect, onHover }: DotProps) {
  return (
    <button
      type="button"
      aria-label={highlighted ? `${a.title}, ${a.location}` : `${a.title} (ne odgovara filterima)`}
      onClick={() => onSelect(a.id)}
      onMouseEnter={() => onHover(a.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(a.id)}
      onBlur={() => onHover(null)}
      className={`group absolute -translate-x-1/2 -translate-y-1/2 p-1 outline-none hover:z-30 focus-visible:z-30 ${active ? "z-30" : highlighted ? "z-10" : ""} ${highlighted ? "cursor-pointer" : "cursor-default"}`}
      style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
    >
      <span
        className={`block size-3.5 rounded-full ring-2 transition group-hover:scale-125 group-focus-visible:scale-125 ${active ? "scale-150 ring-rose-300" : "ring-white"} ${highlighted ? "bg-rose-600" : "bg-zinc-400"}`}
      />
      <span
        className={`pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-xs text-white shadow group-hover:block group-focus-visible:block ${active ? "block" : "hidden"}`}
      >
        {a.title}
      </span>
    </button>
  );
}

/** A white map of Bosnia and Herzegovina with main roads, big cities and a dot for every activity. */
export default function BosniaMap({ activities, highlightedIds, activeId, onSelect, onHover }: Props) {
  const dotProps = (a: Activity) => ({
    activity: a,
    highlighted: highlightedIds.includes(a.id),
    active: a.id === activeId,
    onSelect,
    onHover,
  });

  return (
    <div className="relative">
      <svg
        viewBox={`${-PAD} ${-PAD} ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="block h-auto w-full drop-shadow-2xl"
        aria-hidden
      >
        <defs>
          <clipPath id="bosnia-clip">
            <path d={outline} />
          </clipPath>
        </defs>

        <path d={outline} className="fill-white" />

        <g
          clipPath="url(#bosnia-clip)"
          fill="none"
          className="stroke-zinc-300"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {roads.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>

        <path d={outline} fill="none" className="stroke-black" strokeWidth={4} strokeLinejoin="round" />

        {/* Marks the area shown zoomed in the "Sarajevo i okolina" box */}
        <rect
          x={boxLeft}
          y={boxTop}
          width={boxRight - boxLeft}
          height={boxBottom - boxTop}
          rx={4}
          className="fill-rose-500/10 stroke-rose-500"
          strokeWidth={2.5}
          strokeDasharray="6 4"
        />

        {cities.map((c) => {
          const [x, y] = project(c.coordinates[1], c.coordinates[0]);
          const { dx, dy, anchor } = labelPlacement[c.label ?? "right"];
          return (
            <g key={c.name} className="fill-zinc-600">
              <circle cx={x} cy={y} r={c.capital ? 7 : 5} />
              {/* The white stroke behind the text keeps names readable on top of roads. */}
              <text
                x={x + dx}
                y={y + dy}
                textAnchor={anchor}
                fontSize={c.capital ? 30 : 24}
                fontWeight={c.capital ? 600 : 500}
                stroke="white"
                strokeWidth={6}
                strokeLinejoin="round"
                paintOrder="stroke"
              >
                {c.name}
              </text>
            </g>
          );
        })}
      </svg>

      {activities
        .filter((a) => !inSarajevo(a.coordinates))
        .map((a) => {
          const [x, y] = project(a.coordinates[1], a.coordinates[0]);
          return <Dot key={a.id} {...dotProps(a)} x={(x + PAD) / VIEW_WIDTH} y={(y + PAD) / VIEW_HEIGHT} />;
        })}

      <div className="absolute bottom-[3%] left-0 w-[36%] rounded-xl border-2 border-black bg-white p-2 shadow-xl">
        <p className="mb-1 text-xs font-semibold tracking-wider text-rose-600 uppercase">Sarajevo i okolina</p>
        <div className="relative rounded-md bg-zinc-50" style={{ aspectRatio: SARAJEVO_ASPECT }}>
          {activities
            .filter((a) => inSarajevo(a.coordinates))
            .map((a) => {
              const [x, y] = insetPosition(a.coordinates);
              return <Dot key={a.id} {...dotProps(a)} x={x} y={y} />;
            })}
        </div>
      </div>
    </div>
  );
}
