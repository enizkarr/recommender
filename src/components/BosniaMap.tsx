"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { bosniaBorder } from "@/data/bosniaBorder";
import { bosniaRoads } from "@/data/bosniaRoads";
import Landmark from "@/components/Landmark";
import { cities, type City } from "@/data/cities";
import { useT } from "@/i18n/LangProvider";
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

// City badges are little map pins: a light circle with the landmark, whose tip touches the city.
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
 * `unit` shrinks badges and names when the map is shown enlarged, so they keep a readable size
 * on screen, and strokes keep their width on screen.
 */
function MapLayers({
  clipId,
  unit,
  showNames,
  selectedCity,
  onHoverCity,
  onSelectCity,
}: {
  clipId: string;
  unit: number;
  /** City names next to the badges; the desktop's zoomed box leaves them out, its heading names the city. */
  showNames: boolean;
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

      <path d={outline} className="fill-[color-mix(in_srgb,var(--soft)_35%,var(--surface))]" />

      <g
        clipPath={`url(#${clipId})`}
        fill="none"
        className="stroke-rim"
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
        className="stroke-ink"
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
        const outlineClass = selected ? "fill-surface stroke-accent" : "fill-surface stroke-muted/60";
        const outlineWidth = (selected ? 3.5 : 1.5) * unit;
        return (
          <g
            key={c.name}
            className="cursor-pointer fill-ink"
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
            {showNames && (
              // The light stroke behind the text keeps names readable on top of roads.
              <text
                x={x + dx * unit}
                y={cy + dy * unit}
                textAnchor={anchor}
                fontSize={(c.capital ? 30 : 24) * unit}
                fontWeight={c.capital ? 600 : 500}
                className="stroke-surface"
                strokeWidth={6 * unit}
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
  /** City whose surroundings the cards are limited to, drawn with an accent outline. */
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
  const t = useT();
  return (
    <button
      type="button"
      aria-label={highlighted ? `${a.title}, ${a.location}` : t.map.notMatching(a.title)}
      onClick={() => onSelect(a.id)}
      onMouseEnter={() => onHover(a.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(a.id)}
      onBlur={() => onHover(null)}
      className={`group absolute -translate-x-1/2 -translate-y-1/2 p-1 outline-none hover:z-30 focus-visible:z-30 ${active ? "z-30" : highlighted ? "z-10" : ""} ${highlighted ? "cursor-pointer" : "cursor-default"}`}
      style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
    >
      <span
        className={`block size-4 rounded-full ring-2 transition group-hover:scale-125 group-focus-visible:scale-125 ${active ? "scale-150 ring-sun" : "ring-rim"} ${highlighted ? "bg-accent" : "bg-muted/50"}`}
      />
      <span
        className={`pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs text-surface shadow group-hover:block group-focus-visible:block ${active ? "block" : "hidden"}`}
      >
        {a.title}
      </span>
    </button>
  );
}

/** The city and its landmark, shown above a hovered badge. Position as fractions (0–1) of the containing box. */
function CityTooltip({ city, selected, x, y }: { city: City; selected: boolean; x: number; y: number }) {
  const t = useT();
  return (
    <span
      className="pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs text-surface shadow"
      style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
    >
      <span className="font-semibold">{city.name}</span> · {t.map.landmarks[city.landmark] ?? city.landmark}
      <span className="block opacity-70">{selected ? t.map.cityShowAll : t.map.cityShowNear}</span>
    </span>
  );
}

// Phones: the map is too small for the magnifier, so instead the whole map can be zoomed and moved.
const PHONE_QUERY = "(max-width: 639px)";
const MAX_ZOOM = 4;
const MIN_VIEW_W = VIEW_WIDTH / MAX_ZOOM;
/** While zooming in, badges grow until they are about this big on screen, then keep that size. */
const BADGE_SCREEN_PX = 15;
const DOUBLE_TAP_MS = 300;
/** A finger that moves further than this is dragging the map, not tapping a dot or a town. */
const TAP_SLOP_PX = 8;

/** The part of the map that is shown, in map units; its height follows from the map's proportions. */
interface View {
  x: number;
  y: number;
  w: number;
}

const FULL_VIEW: View = { x: 0, y: 0, w: VIEW_WIDTH };
const viewHeight = (w: number) => (w * VIEW_HEIGHT) / VIEW_WIDTH;
const clampWidth = (w: number) => Math.min(Math.max(w, MIN_VIEW_W), VIEW_WIDTH);

function clampView({ x, y, w }: View): View {
  const width = clampWidth(w);
  return {
    x: Math.min(Math.max(x, 0), VIEW_WIDTH - width),
    y: Math.min(Math.max(y, 0), VIEW_HEIGHT - viewHeight(width)),
    w: width,
  };
}

function subscribePhone(onChange: () => void) {
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** True on phone-sized screens; false on the server, so the first render matches the larger layout. */
function useIsPhone(): boolean {
  return useSyncExternalStore(subscribePhone, () => window.matchMedia(PHONE_QUERY).matches, () => false);
}

function ZoomButton({ label, onClick, children }: { label: string; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-10 place-items-center rounded-full bg-surface text-xl font-medium text-ink shadow-soft transition active:scale-95"
    >
      {children}
    </button>
  );
}

/**
 * A soft blue map of Bosnia and Herzegovina with main roads, big cities and a dot for every activity.
 * Larger screens get a movable magnifier; on phones the whole map zooms (pinch, double tap or buttons)
 * and moves with a finger.
 */
export default function BosniaMap({ activities, highlightedIds, activeId, onSelect, onHover, selectedCity, onSelectCity }: Props) {
  const t = useT();
  const clipId = useId();
  const mapRef = useRef<HTMLDivElement>(null);
  const phone = useIsPhone();
  const [lens, setLens] = useState<Lens>({ x: lensStartX, y: lensStartY });
  const drag = useRef<{ pointerX: number; pointerY: number; lens: Lens } | null>(null);
  // City whose badge the pointer is over, and whether that is in the zoomed box.
  const [hoveredCity, setHoveredCity] = useState<{ name: string; inset: boolean } | null>(null);
  const hovered = hoveredCity && cities.find((c) => c.name === hoveredCity.name);

  // Phones: which part of the map is shown, and how wide the map is on screen.
  const [zoomView, setZoomView] = useState<View>(FULL_VIEW);
  const [mapWidth, setMapWidth] = useState(0);
  const view = phone ? zoomView : FULL_VIEW;
  const viewH = viewHeight(view.w);
  const zoomed = phone && zoomView.w < VIEW_WIDTH - 0.5;
  // Badges and names keep a readable size on screen as the map is enlarged.
  const unit = phone && mapWidth ? Math.min(1, (BADGE_SCREEN_PX * view.w) / (mapWidth * BADGE_RADIUS)) : 1;
  /** Position of a map point as fractions (0–1) of the shown area. */
  const place = ([x, y]: [number, number]): [number, number] => [(x - view.x) / view.w, (y - view.y) / viewH];

  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setMapWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

  // --- Phone gestures: pinch to zoom, drag to move, double tap to zoom in. ---
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({ moved: 0, lastTap: { at: 0, x: 0, y: 0 } });
  // Set once a finger has dragged, so lifting it does not also "tap" the dot or town underneath.
  const suppressClick = useRef(false);

  /**
   * Zooms by `factor`, keeping the spot of the map that was under `from` (screen coordinates)
   * under `to`, so pinching also moves the map with the fingers.
   */
  function zoomAround(current: View, factor: number, from: { x: number; y: number }, to = from): View {
    const rect = mapRef.current!.getBoundingClientRect();
    const mapX = current.x + ((from.x - rect.left) / rect.width) * current.w;
    const mapY = current.y + ((from.y - rect.top) / rect.height) * viewHeight(current.w);
    const w = clampWidth(current.w / factor);
    return clampView({
      x: mapX - ((to.x - rect.left) / rect.width) * w,
      y: mapY - ((to.y - rect.top) / rect.height) * viewHeight(w),
      w,
    });
  }

  function zoomBy(factor: number) {
    setZoomView((v) => {
      const w = clampWidth(v.w / factor);
      const centerX = v.x + v.w / 2;
      const centerY = v.y + viewHeight(v.w) / 2;
      return clampView({ x: centerX - w / 2, y: centerY - viewHeight(w) / 2, w });
    });
  }

  function pointerDown(e: React.PointerEvent) {
    if (!phone) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      gesture.current.moved = 0;
      suppressClick.current = false;
    }
  }

  function pointerMove(e: React.PointerEvent) {
    const previous = pointers.current.get(e.pointerId);
    if (!phone || !previous) return;
    const next = { x: e.clientX, y: e.clientY };
    const others = [...pointers.current].filter(([id]) => id !== e.pointerId).map(([, p]) => p);
    pointers.current.set(e.pointerId, next);
    gesture.current.moved += Math.hypot(next.x - previous.x, next.y - previous.y);
    if (gesture.current.moved > TAP_SLOP_PX) suppressClick.current = true;

    if (others.length === 1) {
      // Two fingers: zoom by how much they spread, around the point between them.
      const other = others[0];
      const before = Math.hypot(previous.x - other.x, previous.y - other.y);
      const after = Math.hypot(next.x - other.x, next.y - other.y);
      if (before < 1) return;
      const mid = (p: { x: number; y: number }) => ({ x: (p.x + other.x) / 2, y: (p.y + other.y) / 2 });
      setZoomView((v) => zoomAround(v, after / before, mid(previous), mid(next)));
    } else if (others.length === 0 && zoomed) {
      // One finger on an enlarged map: move it. (Fully zoomed out, one finger scrolls the page instead.)
      const rect = mapRef.current!.getBoundingClientRect();
      setZoomView((v) =>
        clampView({
          x: v.x - ((next.x - previous.x) / rect.width) * v.w,
          y: v.y - ((next.y - previous.y) / rect.height) * viewHeight(v.w),
          w: v.w,
        }),
      );
    }
  }

  function pointerEnd(e: React.PointerEvent) {
    if (!pointers.current.delete(e.pointerId) || !phone) return;
    if (e.type !== "pointerup" || pointers.current.size > 0 || gesture.current.moved > TAP_SLOP_PX) return;
    // A second tap close to the first one: zoom in there, or back out when already fully zoomed in.
    const last = gesture.current.lastTap;
    if (e.timeStamp - last.at < DOUBLE_TAP_MS && Math.hypot(e.clientX - last.x, e.clientY - last.y) < 30) {
      const at = { x: e.clientX, y: e.clientY };
      setZoomView((v) => (v.w <= MIN_VIEW_W + 0.5 ? FULL_VIEW : zoomAround(v, 2, at)));
      gesture.current.lastTap = { at: 0, x: 0, y: 0 };
    } else {
      gesture.current.lastTap = { at: e.timeStamp, x: e.clientX, y: e.clientY };
    }
  }

  return (
    <div className="relative">
      <div
        ref={mapRef}
        className={phone ? "relative overflow-hidden rounded-2xl" : "relative"}
        // Fully zoomed out, a vertical swipe still scrolls the page; once enlarged, the map takes every gesture.
        style={phone ? { touchAction: zoomed ? "none" : "pan-y" } : undefined}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerEnd}
        onPointerCancel={pointerEnd}
        onClickCapture={(e) => {
          if (!suppressClick.current) return;
          suppressClick.current = false;
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <svg viewBox={`${view.x} ${view.y} ${view.w} ${viewH}`} className="block h-auto w-full drop-shadow-xl" style={{ aspectRatio: VIEW_WIDTH / VIEW_HEIGHT }} aria-hidden>
          <MapLayers
            clipId={`${clipId}-map`}
            unit={unit}
            showNames
            selectedCity={selectedCity}
            onSelectCity={onSelectCity}
            onHoverCity={(name) => setHoveredCity(name ? { name, inset: false } : null)}
          />
        </svg>

        {hovered &&
          !hoveredCity.inset &&
          (() => {
            const { x, cy, r } = badge(hovered, unit);
            const [left, top] = place([x, cy - r - 4 * unit]);
            return <CityTooltip city={hovered} selected={hovered.name === selectedCity} x={left} y={top} />;
          })()}

        {positioned
          .filter(({ at }) => (phone ? true : !inLens(lens, at)))
          .map(({ a, at }) => {
            const [x, y] = place(at);
            // Dots outside the shown part of an enlarged map are left out.
            if (x < -0.02 || x > 1.02 || y < -0.02 || y > 1.02) return null;
            return <Dot key={a.id} {...dotProps(a)} x={x} y={y} />;
          })}

        {!phone && (
          <>
            {/* The magnifier frame: drag it (or focus it and use the arrow keys) to choose what the box shows. */}
            <button
              type="button"
              aria-label={t.map.lensLabel(cityInLens?.name)}
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={() => (drag.current = null)}
              onPointerCancel={() => (drag.current = null)}
              onKeyDown={moveWithKeys}
              className="absolute z-20 cursor-grab touch-none rounded border-[2.5px] border-dashed border-accent bg-accent/10 outline-none focus-visible:ring-2 focus-visible:ring-accent active:cursor-grabbing"
              style={{
                left: `${(lens.x / VIEW_WIDTH) * 100}%`,
                top: `${(lens.y / VIEW_HEIGHT) * 100}%`,
                width: `${(LENS_W / VIEW_WIDTH) * 100}%`,
                height: `${(LENS_H / VIEW_HEIGHT) * 100}%`,
              }}
            />

            <div
              className="absolute bottom-[3%] left-0 rounded-2xl border-[6px] border-rim bg-surface p-2 shadow-soft"
              style={{ width: `${INSET_WIDTH * 100}%` }}
            >
              <p className="mb-1 flex items-baseline justify-between gap-2 text-xs font-semibold tracking-wider text-accent uppercase">
                <span>{cityInLens ? cityInLens.name : t.map.lens}</span>
                <span className="font-normal tracking-normal text-muted normal-case">{t.map.lensHelp}</span>
              </p>
              <div className="relative overflow-hidden rounded-md bg-page" style={{ aspectRatio: LENS_W / LENS_H }}>
                <svg
                  viewBox={`${lens.x} ${lens.y} ${LENS_W} ${LENS_H}`}
                  className="absolute inset-0 block h-full w-full"
                  aria-hidden
                >
                  <MapLayers
                    clipId={`${clipId}-inset`}
                    unit={INSET_UNIT}
                    showNames={false}
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
          </>
        )}
      </div>

      {/* Outside the gesture area, so tapping the buttons quickly is not taken for a double tap on the map. */}
      {phone && (
        <>
          {!zoomed && (
            <p className="pointer-events-none mt-2 text-center text-xs text-muted">{t.map.pinchHint}</p>
          )}
          <div className="absolute top-2 right-2 z-40 flex flex-col gap-2">
            <ZoomButton label={t.map.zoomIn} onClick={() => zoomBy(2)}>
              +
            </ZoomButton>
            <ZoomButton label={t.map.zoomOut} onClick={() => zoomBy(0.5)}>
              −
            </ZoomButton>
            {zoomed && (
              <ZoomButton label={t.map.zoomReset} onClick={() => setZoomView(FULL_VIEW)}>
                ⤢
              </ZoomButton>
            )}
          </div>
        </>
      )}
    </div>
  );
}
