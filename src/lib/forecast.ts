import { useEffect, useState } from "react";
import { describe, WEATHER_CITIES } from "@/components/WeatherWidget";
import { cities } from "@/data/cities";

/** The forecast for one day. */
export interface DayForecast {
  /** "2026-10-31", in Sarajevo time. */
  date: string;
  code: number;
  max: number;
  min: number;
  /** Highest chance of rain during the day, in percent. */
  rainChance: number;
}

export interface WeekendForecast {
  /** Where the forecast is for: the starting point, or Bosnia and Herzegovina as a whole. */
  place: string;
  /** The coming Saturday and Sunday; only Sunday when today is Sunday. */
  days: DayForecast[];
}

interface DailyResponse {
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: (number | null)[];
  };
}

const weekday = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

/**
 * Positions of the weekend days in a forecast that starts today: this Saturday and Sunday on
 * weekdays, today and tomorrow on a Saturday, and only today on a Sunday.
 */
function weekendIndexes(dates: string[]): number[] {
  const saturday = dates.findIndex((date) => weekday(date) === 6);
  if (weekday(dates[0]) === 0) return [0];
  return [saturday, saturday + 1].filter((i) => i >= 0 && i < dates.length);
}

async function fetchDaily(points: [number, number][]): Promise<DailyResponse[]> {
  const params = new URLSearchParams({
    latitude: points.map((p) => p[0]).join(","),
    longitude: points.map((p) => p[1]).join(","),
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    forecast_days: "7",
    timezone: "Europe/Sarajevo",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo: ${res.status}`);
  const data: DailyResponse | DailyResponse[] = await res.json();
  // One location answers with an object, several with a list in the same order.
  return Array.isArray(data) ? data : [data];
}

/** The condition shared by the most places; ties go to the first place in the list. */
function mostCommonCode(codes: number[]): number {
  const counts = new Map<string, number>();
  for (const c of codes) counts.set(describe(c).label, (counts.get(describe(c).label) ?? 0) + 1);
  return codes.reduce((best, c) => (counts.get(describe(c).label)! > counts.get(describe(best).label)! ? c : best));
}

const average = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;

async function fetchWeekend(start: { name: string; coordinates: [number, number] } | null): Promise<WeekendForecast> {
  // Without a starting point, the same five cities as the weather widget stand for the whole country.
  const points = start ? [start.coordinates] : WEATHER_CITIES.map((name) => cities.find((c) => c.name === name)!.coordinates);
  const places = await fetchDaily(points);
  const dates = places[0].daily.time;
  const days = weekendIndexes(dates).map((i) => {
    const at = (key: "temperature_2m_max" | "temperature_2m_min") => Math.round(average(places.map((p) => p.daily[key][i])));
    return {
      date: dates[i],
      code: mostCommonCode(places.map((p) => p.daily.weather_code[i])),
      max: at("temperature_2m_max"),
      min: at("temperature_2m_min"),
      rainChance: Math.round(average(places.map((p) => p.daily.precipitation_probability_max[i] ?? 0))),
    };
  });
  return { place: start?.name ?? "Bosna i Hercegovina", days };
}

/**
 * The weekend forecast for the starting point (or the whole country): undefined while loading,
 * null if it could not be loaded.
 */
export function useWeekendForecast(start: { name: string; coordinates: [number, number] } | null): WeekendForecast | null | undefined {
  // Plain values, so the forecast is only fetched again when the place really changes.
  const name = start?.name ?? null;
  const key = start ? start.coordinates.join(",") : "bih";
  const [loaded, setLoaded] = useState<{ key: string; forecast: WeekendForecast | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const coordinates = key === "bih" ? null : (key.split(",").map(Number) as [number, number]);
    fetchWeekend(coordinates && name ? { name, coordinates } : null)
      .then((forecast) => !cancelled && setLoaded({ key, forecast }))
      .catch(() => !cancelled && setLoaded({ key, forecast: null }));
    return () => {
      cancelled = true;
    };
  }, [key, name]);

  return loaded?.key === key ? loaded.forecast : undefined;
}

const dayNames = ["Nedjelja", "Ponedjeljak", "Utorak", "Srijeda", "Četvrtak", "Petak", "Subota"];
const monthNames = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "avg", "sep", "okt", "nov", "dec"];

/** "Subota, 1. nov". */
export function dayLabel(date: string): string {
  const [, m, d] = date.split("-").map(Number);
  return `${dayNames[weekday(date)]}, ${d}. ${monthNames[m - 1]}`;
}
