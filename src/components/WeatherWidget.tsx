"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cities } from "@/data/cities";
import { useT } from "@/i18n/LangProvider";
import { useStartLocation } from "@/lib/startLocation";

// Spread across the country; without a starting point their combined weather is shown, as a picture of the whole of BiH.
export const WEATHER_CITIES = ["Sarajevo", "Banja Luka", "Mostar", "Tuzla", "Bihać"];
const REFRESH_MS = 15 * 60 * 1000;

interface CityWeather {
  name: string;
  temperature: number;
  code: number;
  isDay: boolean;
}

/** What the card shows: one place's weather, or the whole country summed up. */
interface Weather {
  /** The starting point, or null for the whole country. */
  place: string | null;
  temperature: number;
  code: number;
  isDay: boolean;
  min: number;
  max: number;
  /** What the numbers cover, for the note under the bubble: an average of this many cities, or one place today. */
  averageOf: number | null;
}

export type Sky = "clear" | "partly" | "overcast" | "fog" | "rain" | "snow" | "storm";

/** The kinds of weather the page names; the names themselves are in the dictionaries (t.weather). */
export type WeatherKind =
  | "clear"
  | "mostlyClear"
  | "partly"
  | "overcast"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "showers"
  | "snowShowers"
  | "storm"
  | "changeable";

/** WMO weather code (as used by Open-Meteo) to the kind of weather and a sky type. */
export function describe(code: number): { kind: WeatherKind; sky: Sky } {
  if (code === 0) return { kind: "clear", sky: "clear" };
  if (code === 1) return { kind: "mostlyClear", sky: "clear" };
  if (code === 2) return { kind: "partly", sky: "partly" };
  if (code === 3) return { kind: "overcast", sky: "overcast" };
  if (code === 45 || code === 48) return { kind: "fog", sky: "fog" };
  if (code >= 51 && code <= 57) return { kind: "drizzle", sky: "rain" };
  if (code >= 61 && code <= 67) return { kind: "rain", sky: "rain" };
  if (code >= 71 && code <= 77) return { kind: "snow", sky: "snow" };
  if (code >= 80 && code <= 82) return { kind: "showers", sky: "rain" };
  if (code === 85 || code === 86) return { kind: "snowShowers", sky: "snow" };
  if (code >= 95) return { kind: "storm", sky: "storm" };
  return { kind: "changeable", sky: "partly" };
}

// Thin white line icons in the style of the weather design.
function Svg({ children, className = "size-5" }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

const cloud = <path d="M7 18h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 7 9.5 4.25 4.25 0 0 0 7 18Z" />;

export function SkyIcon({ sky, isDay, className }: { sky: Sky; isDay: boolean; className?: string }) {
  if (sky === "clear")
    return isDay ? (
      <Svg className={className}>
        <circle cx={12} cy={12} r={4} />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
      </Svg>
    ) : (
      <Svg className={className}>
        <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
      </Svg>
    );
  if (sky === "partly")
    return (
      <Svg className={className}>
        <path d="M8.5 6.5a4 4 0 0 1 6.9 1.6M8.5 2.5v1.2M3.5 7.5h1.2M5 4l.8.8" />
        <path d="M8 20h9a3.5 3.5 0 0 0 .4-6.98A5 5 0 0 0 8 12.5a3.75 3.75 0 0 0 0 7.5Z" />
      </Svg>
    );
  if (sky === "fog")
    return (
      <Svg className={className}>
        <path d="M4 9h16M3 13h18M5 17h14M8 21h8" />
      </Svg>
    );
  if (sky === "rain")
    return (
      <Svg className={className}>
        <path d="M7 15h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 7 6.5 4.25 4.25 0 0 0 7 15Z" />
        <path d="M8 18l-1 2.5M12 18l-1 2.5M16 18l-1 2.5" />
      </Svg>
    );
  if (sky === "snow")
    return (
      <Svg className={className}>
        <path d="M7 15h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 7 6.5 4.25 4.25 0 0 0 7 15Z" />
        <path d="M8 19h.01M12 20.5h.01M16 19h.01M10 22h.01M14 22h.01" strokeWidth={2.4} />
      </Svg>
    );
  if (sky === "storm")
    return (
      <Svg className={className}>
        <path d="M7 15h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 7 6.5 4.25 4.25 0 0 0 7 15Z" />
        <path d="M12.5 15 10.5 18.5h3l-2 3.5" />
      </Svg>
    );
  return <Svg className={className}>{cloud}</Svg>;
}

async function fetchCountry(): Promise<Weather> {
  const picked = WEATHER_CITIES.map((name) => cities.find((c) => c.name === name)!);
  const params = new URLSearchParams({
    latitude: picked.map((c) => c.coordinates[0]).join(","),
    longitude: picked.map((c) => c.coordinates[1]).join(","),
    current: "temperature_2m,weather_code,is_day",
    timezone: "Europe/Sarajevo",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo: ${res.status}`);
  // With several locations the API answers with one entry per location, in the same order.
  const data: { current: { temperature_2m: number; weather_code: number; is_day: number } }[] = await res.json();
  const list: CityWeather[] = data.map((d, i) => ({
    name: picked[i].name,
    temperature: Math.round(d.current.temperature_2m),
    code: d.current.weather_code,
    isDay: d.current.is_day === 1,
  }));
  const overall = mostCommon(list);
  const temps = list.map((c) => c.temperature);
  return {
    place: null,
    temperature: Math.round(temps.reduce((sum, t) => sum + t, 0) / temps.length),
    code: overall.code,
    isDay: overall.isDay,
    min: Math.min(...temps),
    max: Math.max(...temps),
    averageOf: list.length,
  };
}

/** Current weather at the starting point, with today's lowest and highest temperature there. */
async function fetchPlace(place: string, [latitude, longitude]: [number, number]): Promise<Weather> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,weather_code,is_day",
    daily: "temperature_2m_min,temperature_2m_max",
    forecast_days: "1",
    timezone: "Europe/Sarajevo",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo: ${res.status}`);
  const data: {
    current: { temperature_2m: number; weather_code: number; is_day: number };
    daily: { temperature_2m_min: number[]; temperature_2m_max: number[] };
  } = await res.json();
  return {
    place,
    temperature: Math.round(data.current.temperature_2m),
    code: data.current.weather_code,
    isDay: data.current.is_day === 1,
    min: Math.round(data.daily.temperature_2m_min[0]),
    max: Math.round(data.daily.temperature_2m_max[0]),
    averageOf: null,
  };
}

/** The condition shared by the most cities; ties go to the first city in the list. */
function mostCommon(list: CityWeather[]): CityWeather {
  const counts = new Map<string, number>();
  for (const c of list) counts.set(describe(c.code).kind, (counts.get(describe(c.code).kind) ?? 0) + 1);
  return list.reduce((best, c) => (counts.get(describe(c.code).kind)! > counts.get(describe(best.code).kind)! ? c : best));
}

// Painted sky behind the numbers: one gradient per sky type, and a night-time one.
const skies: Record<Sky, string> = {
  clear: "linear-gradient(170deg, #1f4f9c, #3f7bd0 55%, #79a8e4)",
  partly: "linear-gradient(170deg, #2d5c9e, #5d8fcf 55%, #a3c1e6)",
  overcast: "linear-gradient(170deg, #4a5d78, #7a8ca6 60%, #a9b6c8)",
  fog: "linear-gradient(170deg, #66778d, #9aa7b8 60%, #c7cfda)",
  rain: "linear-gradient(170deg, #2a4262, #4d6a8f 60%, #7f98b6)",
  snow: "linear-gradient(170deg, #5d81ad, #9fb9d8 60%, #dfe8f3)",
  storm: "linear-gradient(170deg, #1b2335, #39435c 60%, #5d6782)",
};
const nightSky = "linear-gradient(170deg, #0a1730, #183058 60%, #2c4a7a)";
// The sun from the design, drawn in the top-right corner on clear days.
const sun = "radial-gradient(circle at 76% 26%, #ffe9a3 0 9%, #f7c948 10% 15%, rgba(247,201,72,.35) 16% 24%, transparent 25%)";
// Two soft clouds along the bottom edge.
const clouds =
  "radial-gradient(ellipse 34% 16% at 82% 80%, rgba(255,255,255,.85) 60%, transparent 62%), radial-gradient(ellipse 26% 14% at 16% 88%, rgba(255,255,255,.8) 60%, transparent 62%)";

/** Whether a weather code means a day for staying under a roof (rain, showers or a storm). */
export function isRainy(code: number): boolean {
  const { sky } = describe(code);
  return sky === "rain" || sky === "storm";
}

/** Uneven rounded outline, so the card reads as a bubble rather than a box. */
const bubble = "rounded-[58%_42%_52%_48%/46%_56%_44%_54%]";

/**
 * The current weather at the family's starting point, or across Bosnia and Herzegovina when none
 * is set, as a sky-coloured bubble.
 */
export default function WeatherWidget({
  className = "",
  onWeather,
}: {
  className?: string;
  /** Called with the weather code after each load, or null when the weather could not be loaded. */
  onWeather?: (code: number | null) => void;
}) {
  const t = useT();
  const start = useStartLocation();
  // Plain values, so the weather is only fetched again when the place really changes.
  const startName = start?.name;
  const startLat = start?.coordinates[0];
  const startLon = start?.coordinates[1];
  const [weather, setWeather] = useState<Weather | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [failed, setFailed] = useState(false);
  // Kept in a ref so a new callback on every parent render does not start a new request.
  const report = useRef(onWeather);
  useEffect(() => {
    report.current = onWeather;
  });

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      (startName && startLat !== undefined && startLon !== undefined ? fetchPlace(startName, [startLat, startLon]) : fetchCountry())
        .then((w) => {
          if (cancelled) return;
          setWeather(w);
          setUpdatedAt(new Date());
          setFailed(false);
          report.current?.(w.code);
        })
        .catch(() => {
          if (cancelled) return;
          setFailed(true);
          report.current?.(null);
        });
    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [startName, startLat, startLon]);

  const summary = weather && describe(weather.code);
  const background = !weather
    ? skies.overcast
    : !weather.isDay
      ? `${clouds.replaceAll(".8", ".18")}, ${nightSky}`
      : summary!.sky === "clear"
        ? `${sun}, ${clouds}, ${skies.clear}`
        : `${clouds}, ${skies[summary!.sky]}`;

  return (
    <aside aria-label={t.weather.label(weather?.place ?? t.country)} className={className}>
      <div
        className={`relative h-[230px] overflow-hidden border-[9px] border-rim text-white shadow-soft ${bubble}`}
        style={{ background }}
      >
        {failed && !weather && <p className="absolute inset-x-8 top-20 text-sm text-white/85">{t.weather.unavailable}</p>}

        {!failed && !weather && (
          // Placeholder with the same shape while the first request is on its way
          <div className="absolute top-14 left-8 animate-pulse space-y-3" aria-hidden>
            <div className="h-12 w-24 rounded-lg bg-white/25" />
            <div className="h-4 w-20 rounded bg-white/20" />
          </div>
        )}

        {weather && summary && (
          <>
            <p className="absolute top-12 left-7 text-[56px] leading-none font-medium tracking-tight">{weather.temperature}°</p>
            <p className="absolute top-[112px] left-8 text-[17px]">{t.weather[summary.kind]}</p>
            <p className="absolute top-[138px] left-8 text-xs text-white/85">
              {t.weather.minMax(weather.min, weather.max)}
            </p>
            {/* The painted sun already shows a clear day; other skies get their icon in that corner. */}
            {(summary.sky !== "clear" || !weather.isDay) && (
              <SkyIcon sky={summary.sky} isDay={weather.isDay} className="absolute top-9 right-9 size-16 text-white/90" />
            )}
            <p className="absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1 text-[13px] whitespace-nowrap text-[#14305a]">
              <Svg className="size-3.5">
                <path d="M12 21s-6.5-5.8-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.2 12 21 12 21Z" />
                <circle cx={12} cy={10} r={2.3} />
              </Svg>
              {weather.place ?? t.country}
            </p>
          </>
        )}
      </div>
      <p className="mt-2 text-center text-[11px] text-muted">
        {weather && `${weather.averageOf ? t.weather.average(weather.averageOf) : t.weather.today} · `}
        {t.weather.source}{" "}
        <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
          Open-Meteo
        </a>
        {updatedAt && ` · ${updatedAt.toLocaleTimeString(t.timeLocale, { hour: "2-digit", minute: "2-digit" })}`}
      </p>
    </aside>
  );
}
