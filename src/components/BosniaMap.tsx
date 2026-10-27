"use client";

import { useId, useRef, useState } from "react";
import { bosniaBorder } from "@/data/bosniaBorder";
import { bosniaRoads } from "@/data/bosniaRoads";
import Landmark from "@/components/Landmark";
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

/** Map units, with (0, 0) at the top-left corner of the visible area (padding included). */
function project(lon: number, lat: number): [number, number] {
  return [(lon - minLon) * lonScale * scale + PAD, (maxLat - lat) * scale + PAD];
}

function toPath(points: [number, number][]): string {
  return "M" + points.map(([lon, lat]) => project(lon, lat).map((n) => n.toFixed(1)).join(",")).join("L");
}

const outline = toPath(bosniaBorder) + "Z";
const roads = bosniaRoads.map((r) => toPath(r.points));

// The magnifier frame: a fixed-size area that can be dragged around the map and is shown
// zoomed in the box in the bottom-left corner. It starts over Sarajevo, where most activities are.
const INSET_WIDTH = 0.36; // the zoomed box's width as a share of the map's width
const [lensStartX, lensStartY] = project(18.22, 43.9);
const [lensEndX, lensEndY] = project(18.47, 43.8);
const LENS_W = lensEndX - lensStartX;
const LENS_H = lensEndY - lensStartY;
// Text and dots in the zoomed box are scaled down by this much so they keep their normal on-screen size.
const INSET_UNIT = LENS_W / (INSET_WIDTH * VIEW_WIDTH);
const LENS_STEP = 8; // map units moved per arrow-key press

interface Lens {
  x: number;
  y: number;
}

function clampLens({ x, y }: Lens): Lens {
  return {
    x: Math.min(Math.max(x, 0), VIEW_WIDTH - LENS_W),
    y: Math.min(Math.max(y, 0), VIEW_HEIGHT - LENS_H),
  };
}

function inLens(lens: Lens, [x, y]: [number, number]): boolean {
  return x >= lens.x && x <= lens.x + LENS_W && y >= lens.y && y <= lens.y + LENS_H;
}

// City badges are little map pins: a white circle with the landmark, whose tip touches the city.
const BADGE_RADIUS = 24;
const CAPITAL_BADGE_RADIUS = 28;
const PIN_TIP = 7; // gap between the circle and the city point

/** Badge centre for a city, above the city point, and the badge radius, in map units. */
function badge(c: City, unit: number): { x: number; cy: number; r: number } {
  const [x, y] = project(c.coordinates[1], c.coordinates[0]);
  const r = (c.capital ? CAPITAL_BADGE_RADIUS : BADGE_RADIUS) * unit;
  return { x, cy: y - r - PIN_TIP * unit, r };
}

/** Where a city's name goes, relative to the centre of its badge (r = badge radius). */
function labelPosition(label: City["label"], r: number): { dx: number; dy: number; anchor: "start" | "middle" | "end" } {
  switch (label) {
    case "left":
      return { dx: -(r + 6), dy: 8, anchor: "end" };
    case "above":
      return { dx: 0, dy: -(r + 8), anchor: "middle" };
    case "below":
      // Below the city point itself, i.e. under the pin tip.
      return { dx: 0, dy: r + PIN_TIP + 30, anchor: "middle" };
    default:
      return { dx: r + 6, dy: 8, anchor: "start" };
  }
}

/**
 * Country, roads, border and cities. Drawn once for the full map and again for the zoomed box;
 * `unit` shrinks text and dots in the zoomed box, and strokes keep their width on screen.
 */
function MapLayers({
  clipId,
  unit,
  selectedCity,
  onHoverCity,
  onSelectCity,
}: {
  clipId: string;
  unit: number;
  selectedCity: string | null;
  onHoverCity: (name: string | null) => void;
  onSelectCity: (name: string) => void;
}) {
  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <path d={outline} />
        </clipPath>
      </defs>

      <path d={outline} className="fill-white" />

      <g
        clipPath={`url(#${clipId})`}
        fill="none"
        className="stroke-zinc-300"
        strokeWidth={unit === 1 ? 2 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      >
        {roads.map((d, i) => (
          <path key={i} d={d} vectorEffect="non-scaling-stroke" />
        ))}
      </g>

      <path
        d={outline}
        fill="none"
        className="stroke-black"
        strokeWidth={unit === 1 ? 4 : 3}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />

      {cities.map((c, i) => {
        const { x, cy, r } = badge(c, unit);
        const y = cy + r + PIN_TIP * unit; // the city point, where the pin's tip touches
        const iconScale = (r * 1.6) / 24;
        const { dx, dy, anchor } = labelPosition(c.label, r / unit);
        const selected = c.name === selectedCity;
        const outlineClass = selected ? "fill-white stroke-rose-500" : "fill-white stroke-zinc-400";
        const outlineWidth = (selected ? 3.5 : 1.5) * unit;
        return (
          <g
            key={c.name}
            className="cursor-pointer fill-zinc-600"
            onPointerEnter={() => onHoverCity(c.name)}
            onPointerLeave={() => onHoverCity(null)}
            onClick={() => onSelectCity(c.name)}
          >
            <path
              d={`M${x - 0.4 * r},${cy + 0.85 * r} L${x},${y} L${x + 0.4 * r},${cy + 0.85 * r} Z`}
              className={outlineClass}
              strokeWidth={outlineWidth}
              strokeLinejoin="round"
            />
            <circle cx={x} cy={cy} r={r} className={outlineClass} strokeWidth={outlineWidth} />
            <g transform={`translate(${x - 12 * iconScale} ${cy - 12 * iconScale}) scale(${iconScale})`}>
              {/* Separate group: a CSS animation would replace a transform attribute on the same element. */}
              <g className="landmark-float" style={{ animationDelay: `${-i * 0.37}s` }}>
                <Landmark icon={c.icon} />
              </g>
            </g>
            {/* Names only on the full map: the zoomed box already names the city in its heading,
                and a label there would sit on top of the activity dots. */}
            {unit === 1 && (
              // The white stroke behind the text keeps names readable on top of roads.
              <text
                x={x + dx}
                y={cy + dy}
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
            )}
          </g>
        );
      })}
    </>
  );
}

interface Props {
  activities: Activity[];
  /** Activities in the current results are drawn in colour, the others faded. */
  highlightedIds: string[];
  /** Activity whose card is hovered or that was picked on the map. */
  activeId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  /** City whose surroundings the cards are limited to, drawn with a rose outline. */
  selectedCity: string | null;
  /** A city badge was clicked. */
  onSelectCity: (name: string) => void;
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
        className={`block size-4 rounded-full ring-2 transition group-hover:scale-125 group-focus-visible:scale-125 ${active ? "scale-150 ring-rose-300" : "ring-white"} ${highlighted ? "bg-rose-600" : "bg-zinc-400"}`}
      />
      <span
        className={`pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-xs text-white shadow group-hover:block group-focus-visible:block ${active ? "block" : "hidden"}`}
      >
        {a.title}
      </span>
    </button>
  );
}

/** The city and its landmark, shown above a hovered badge. Position as fractions (0–1) of the containing box. */
function CityTooltip({ city, selected, x, y }: { city: City; selected: boolean; x: number; y: number }) {
  return (
    <span
      className="pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-xs text-white shadow"
      style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
    >
      <span className="font-semibold">{city.name}</span> · {city.landmark}
      <span className="block text-zinc-400">{selected ? "Klikni za sve aktivnosti" : "Klikni za aktivnosti u blizini"}</span>
    </span>
  );
}

/** A white map of Bosnia and Herzegovina with main roads, big cities, a dot for every activity and a movable magnifier. */
export default function BosniaMap({ activities, highlightedIds, activeId, onSelect, onHover, selectedCity, onSelectCity }: Props) {
  const clipId = useId();
  const mapRef = useRef<HTMLDivElement>(null);
  const [lens, setLens] = useState<Lens>({ x: lensStartX, y: lensStartY });
  const drag = useRef<{ pointerX: number; pointerY: number; lens: Lens } | null>(null);
  // City whose badge the pointer is over, and whether that is in the zoomed box.
  const [hoveredCity, setHoveredCity] = useState<{ name: string; inset: boolean } | null>(null);
  const hovered = hoveredCity && cities.find((c) => c.name === hoveredCity.name);

  const dotProps = (a: Activity) => ({
    activity: a,
    highlighted: highlightedIds.includes(a.id),
    active: a.id === activeId,
    onSelect,
    onHover,
  });
  const positioned = activities.map((a) => ({ a, at: project(a.coordinates[1], a.coordinates[0]) }));
  // Name the zoomed box after a city inside the frame, if there is one.
  const cityInLens = cities.find((c) => inLens(lens, project(c.coordinates[1], c.coordinates[0])));

  function startDrag(e: React.PointerEvent<HTMLButtonElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { pointerX: e.clientX, pointerY: e.clientY, lens };
  }

  function moveDrag(e: React.PointerEvent<HTMLButtonElement>) {
    const map = mapRef.current;
    if (!drag.current || !map) return;
    const unitsPerPixel = VIEW_WIDTH / map.getBoundingClientRect().width;
    setLens(
      clampLens({
        x: drag.current.lens.x + (e.clientX - drag.current.pointerX) * unitsPerPixel,
        y: drag.current.lens.y + (e.clientY - drag.current.pointerY) * unitsPerPixel,
      }),
    );
  }

  function moveWithKeys(e: React.KeyboardEvent<HTMLButtonElement>) {
    const step: Record<string, [number, number]> = {
      ArrowLeft: [-LENS_STEP, 0],
      ArrowRight: [LENS_STEP, 0],
      ArrowUp: [0, -LENS_STEP],
      ArrowDown: [0, LENS_STEP],
    };
    const delta = step[e.key];
    if (!delta) return;
    e.preventDefault();
    setLens(clampLens({ x: lens.x + delta[0], y: lens.y + delta[1] }));
  }

  return (
    <div ref={mapRef} className="relative">
      <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} className="block h-auto w-full drop-shadow-2xl" aria-hidden>
        <MapLayers
          clipId={`${clipId}-map`}
          unit={1}
          selectedCity={selectedCity}
          onSelectCity={onSelectCity}
          onHoverCity={(name) => setHoveredCity(name ? { name, inset: false } : null)}
        />
      </svg>

      {hovered &&
        !hoveredCity.inset &&
        (() => {
          const { x, cy, r } = badge(hovered, 1);
          return <CityTooltip city={hovered} selected={hovered.name === selectedCity} x={x / VIEW_WIDTH} y={(cy - r - 4) / VIEW_HEIGHT} />;
        })()}

      {positioned
        .filter(({ at }) => !inLens(lens, at))
        .map(({ a, at: [x, y] }) => (
          <Dot key={a.id} {...dotProps(a)} x={x / VIEW_WIDTH} y={y / VIEW_HEIGHT} />
        ))}

      {/* The magnifier frame: drag it (or focus it and use the arrow keys) to choose what the box shows. */}
      <button
        type="button"
        aria-label={`Okvir za uvećani prikaz${cityInLens ? `, kod: ${cityInLens.name}` : ""} – pomjeri ga mišem ili strelicama`}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onKeyDown={moveWithKeys}
        className="absolute z-20 cursor-grab touch-none rounded border-[2.5px] border-dashed border-rose-500 bg-rose-500/10 outline-none focus-visible:ring-2 focus-visible:ring-rose-500 active:cursor-grabbing"
        style={{
          left: `${(lens.x / VIEW_WIDTH) * 100}%`,
          top: `${(lens.y / VIEW_HEIGHT) * 100}%`,
          width: `${(LENS_W / VIEW_WIDTH) * 100}%`,
          height: `${(LENS_H / VIEW_HEIGHT) * 100}%`,
        }}
      />

      <div
        className="absolute bottom-[3%] left-0 rounded-xl border-2 border-black bg-white p-2 shadow-xl"
        style={{ width: `${INSET_WIDTH * 100}%` }}
      >
        <p className="mb-1 flex items-baseline justify-between gap-2 text-xs font-semibold tracking-wider text-rose-600 uppercase">
          <span>{cityInLens ? cityInLens.name : "Uvećani prikaz"}</span>
          <span className="font-normal tracking-normal text-zinc-400 normal-case">pomjeri okvir na mapi</span>
        </p>
        <div className="relative overflow-hidden rounded-md bg-zinc-100" style={{ aspectRatio: LENS_W / LENS_H }}>
          <svg
            viewBox={`${lens.x} ${lens.y} ${LENS_W} ${LENS_H}`}
            className="absolute inset-0 block h-full w-full"
            aria-hidden
          >
            <MapLayers
              clipId={`${clipId}-inset`}
              unit={INSET_UNIT}
              selectedCity={selectedCity}
              onSelectCity={onSelectCity}
              onHoverCity={(name) => setHoveredCity(name ? { name, inset: true } : null)}
            />
          </svg>
          {hovered &&
            hoveredCity.inset &&
            (() => {
              const { x, cy, r } = badge(hovered, INSET_UNIT);
              return <CityTooltip city={hovered} selected={hovered.name === selectedCity} x={(x - lens.x) / LENS_W} y={(cy - r - 4 * INSET_UNIT - lens.y) / LENS_H} />;
            })()}
          {positioned
            .filter(({ at }) => inLens(lens, at))
            .map(({ a, at: [x, y] }) => (
              <Dot key={a.id} {...dotProps(a)} x={(x - lens.x) / LENS_W} y={(y - lens.y) / LENS_H} />
            ))}
        </div>
      </div>
    </div>
  );
}
