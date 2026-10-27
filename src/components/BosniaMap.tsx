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
}

/** A white map of Bosnia and Herzegovina with main roads, big cities and a dot for every activity. */
export default function BosniaMap({ activities, highlightedIds }: Props) {
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
      {activities.map((a) => {
        const [x, y] = project(a.coordinates[1], a.coordinates[0]);
        const highlighted = highlightedIds.includes(a.id);
        return (
          <span
            key={a.id}
            role="img"
            tabIndex={0}
            aria-label={`${a.title}, ${a.location}`}
            className={`group absolute -translate-x-1/2 -translate-y-1/2 outline-none hover:z-20 focus:z-20 ${highlighted ? "z-10" : ""}`}
            style={{
              left: `${((x + PAD) / VIEW_WIDTH) * 100}%`,
              top: `${((y + PAD) / VIEW_HEIGHT) * 100}%`,
            }}
          >
            <span
              className={`block size-3.5 rounded-full ring-2 ring-white transition group-hover:scale-125 group-focus:scale-125 ${highlighted ? "bg-rose-600" : "bg-zinc-400"}`}
            />
            <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-xs text-white shadow group-hover:block group-focus:block">
              {a.title}
            </span>
          </span>
        );
      })}
    </div>
  );
}
