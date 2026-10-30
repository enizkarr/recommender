import { bosniaBorder } from "@/data/bosniaBorder";
import { useT } from "@/i18n/LangProvider";

// A simple flat projection that fits the country into a 393 × 385 box; enough for a small teaser.
const project = (lat: number, lon: number): [number, number] => [(lon - 15.72) * 100.8, (45.28 - lat) * 141.4];

const outline = `M${bosniaBorder.map(([lon, lat]) => project(lat, lon).map((v) => v.toFixed(1)).join(" ")).join("L")}Z`;

/** Pins closer in height than this (in map units) get their labels stacked above and below. */
const LABEL_CLEARANCE = 34;

interface Pin {
  label: string;
  /** [latitude, longitude] */
  coordinates: [number, number];
}

/**
 * A small illustrated map of BiH with a dot for each activity in the results, and pins for the
 * starting point and the featured activity joined by a dotted line.
 */
export default function MapTeaser({ dots, from, to }: { dots: [number, number][]; from?: Pin; to?: Pin }) {
  const t = useT();
  const pins = [from, to].filter((p): p is Pin => !!p).map((p) => ({ ...p, at: project(...p.coordinates) }));
  const [a, b] = pins.length === 2 ? pins.map((p) => p.at) : [];
  // Labels sit beside their pin. When the two pins are at about the same height their labels would
  // run into each other, so the higher pin's label moves above it and the lower one's below.
  const stacked = a && b && Math.abs(a[1] - b[1]) < LABEL_CLEARANCE;
  const upper = stacked ? (a[1] <= b[1] ? 0 : 1) : -1;
  const labelDy = (i: number) => (!stacked ? 5 : i === upper ? -16 : 28);
  return (
    <svg viewBox="-10 -10 420 410" className="h-auto w-full" role="img" aria-label={t.map.teaser}>
      <path d={outline} className="fill-[color-mix(in_srgb,var(--soft)_55%,var(--surface))] stroke-rim" strokeWidth={4} strokeLinejoin="round" />
      {dots.map(([lat, lon], i) => {
        const [x, y] = project(lat, lon);
        return <circle key={i} cx={x} cy={y} r={4.5} className="fill-ink" opacity={0.7} />;
      })}
      {a && b && (
        <path
          // A gentle bend, so the line reads as a route rather than a ruler
          d={`M${a[0]} ${a[1]} Q${(a[0] + b[0]) / 2 + (b[1] - a[1]) * 0.25} ${(a[1] + b[1]) / 2 - (b[0] - a[0]) * 0.25} ${b[0]} ${b[1]}`}
          fill="none"
          className="stroke-ink"
          strokeWidth={2.5}
          strokeDasharray="2 8"
          strokeLinecap="round"
        />
      )}
      {pins.map(({ label, at: [x, y] }, i) => (
        <g key={label}>
          <circle cx={x} cy={y} r={9} className="fill-sun stroke-ink" strokeWidth={3} />
          <text
            x={x + (x > 300 ? -14 : 14)}
            y={y + labelDy(i)}
            textAnchor={x > 300 ? "end" : "start"}
            className="fill-ink stroke-surface text-[16px] font-semibold"
            strokeWidth={5}
            paintOrder="stroke"
            strokeLinejoin="round"
          >
            {label}
          </text>
        </g>
      ))}
    </svg>
  );
}
