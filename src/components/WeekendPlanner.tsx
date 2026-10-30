"use client";

import Photo from "@/components/Photo";
import { describe, SkyIcon } from "@/components/WeatherWidget";
import { formatDrive, tripKm, type Trip } from "@/lib/driving";
import { useT } from "@/i18n/LangProvider";
import { dayLabel, useWeekendForecast, type DayForecast } from "@/lib/forecast";
import type { StartLocation } from "@/lib/startLocation";
import type { Activity } from "@/lib/types";

/** Below this chance of rain a rainy day reads as "Moguća kiša" (possible rain): the day's code is its worst hour. */
const LIKELY_RAIN = 50;
const SUGGESTIONS_PER_DAY = 3;

type Verdict = "outdoor" | "indoor" | "snow";

// The labels are in the dictionaries (t.weekend.outdoor, …).
const verdictColours: Record<Verdict, string> = {
  outdoor: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  indoor: "bg-accent/12 text-accent",
  snow: "bg-soft/20 text-accent",
};

/** What a day is good for: snow when it snows, under a roof when rain or a storm is likely, outside otherwise. */
function verdictFor(day: DayForecast): Verdict {
  const { sky } = describe(day.code);
  if (sky === "snow") return "snow";
  if ((sky === "rain" || sky === "storm") && day.rainChance >= LIKELY_RAIN) return "indoor";
  return "outdoor";
}

/** Higher is a better day for an outing: going out beats snow beats staying in, then less rain, then warmer. */
function score(day: DayForecast): number {
  const rank = { outdoor: 2, snow: 1, indoor: 0 }[verdictFor(day)];
  return rank * 1000 - day.rainChance * 5 + day.max;
}

/** Activities that suit the day: outdoor ones, indoor ones on a rainy day, snow ones (then indoor) on a snowy day. */
function suits(a: Activity, verdict: Verdict): boolean {
  if (verdict === "indoor") return a.indoor;
  if (verdict === "snow") return a.tags.includes("snow");
  return !a.indoor;
}

interface DayPlan {
  day: DayForecast;
  verdict: Verdict;
  best: boolean;
  suggestions: Activity[];
}

/**
 * The weekend's days with a verdict and suggestions taken from the current results (so filters,
 * search and the starting point all apply, nearest first). The two days do not repeat suggestions.
 */
function planWeekend(days: DayForecast[], results: Activity[]): DayPlan[] {
  const used = new Set<string>();
  const lowest = Math.min(...days.map(score));
  return days.map((day) => {
    const verdict = verdictFor(day);
    const pick = (fits: (a: Activity) => boolean) => results.filter((a) => fits(a) && !used.has(a.id));
    let suggestions = pick((a) => suits(a, verdict)).slice(0, SUGGESTIONS_PER_DAY);
    // Few snow activities: fill up with indoor ones.
    if (verdict === "snow" && suggestions.length < SUGGESTIONS_PER_DAY) {
      suggestions = [...suggestions, ...pick((a) => a.indoor && !suggestions.includes(a))].slice(0, SUGGESTIONS_PER_DAY);
    }
    suggestions.forEach((a) => used.add(a.id));
    // The better of two days, and only when it is a day for going out at all.
    const best = days.length > 1 && verdict !== "indoor" && score(day) > lowest;
    return { day, verdict, best, suggestions };
  });
}

function DayPanel({ plan, tripFor, onOpen }: { plan: DayPlan; tripFor: (a: Activity) => Trip | undefined; onOpen: (id: string) => void }) {
  const t = useT();
  const { day, verdict, best, suggestions } = plan;
  const { kind, sky } = describe(day.code);
  const label = sky === "rain" && day.rainChance < LIKELY_RAIN ? t.weekend.possibleRain : t.weather[kind];
  return (
    <div className={`flex flex-col rounded-3xl bg-page p-4 sm:p-5 ${best ? "ring-2 ring-sun" : ""}`}>
      <div className="flex items-start gap-4">
        <SkyIcon sky={sky} isDay className="size-12 shrink-0 text-accent" />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{dayLabel(day.date, t)}</p>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-1 text-sm">
            <span className="text-lg font-semibold">{day.max}°</span>
            <span className="text-muted"> / {day.min}°</span>
            <span className="ml-3 text-muted">{t.weekend.rainChance(day.rainChance)}</span>
          </p>
        </div>
        {best && <span className="shrink-0 rounded-full bg-sun px-3 py-1 text-xs font-semibold text-[#14305a]">{t.weekend.best}</span>}
      </div>

      <p className={`mt-4 self-start rounded-full px-3 py-1 text-[13px] font-medium ${verdictColours[verdict]}`}>{t.weekend[verdict]}</p>

      {suggestions.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {suggestions.map((a) => {
            const trip = tripFor(a);
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => onOpen(a.id)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-surface p-2 text-left shadow-[0_1px_3px_rgba(40,52,80,.08)] transition hover:-translate-y-0.5"
                >
                  <span className="relative h-12 w-14 shrink-0 overflow-hidden rounded-xl">
                    <Photo a={a} sizes="56px" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{a.title}</span>
                    <span className="block truncate text-xs text-muted">
                      {trip ? `${tripKm(trip, t)}${trip.minutes !== undefined ? ` · 🚗 ${formatDrive(trip.minutes, t)}` : ""}` : a.location}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">{t.weekend.none}</p>
      )}
    </div>
  );
}

interface Props {
  start: StartLocation | null;
  /** The activities that match the current filters, nearest first when there is a starting point. */
  results: Activity[];
  tripFor: (a: Activity) => Trip | undefined;
  /** Opens an activity's details. */
  onOpen: (id: string) => void;
}

/** The coming weekend: the forecast for each day, what the day is good for, and a few ideas for it. */
export default function WeekendPlanner({ start, results, tripFor, onOpen }: Props) {
  const t = useT();
  const forecast = useWeekendForecast(start);
  // Nothing to show if the forecast could not be loaded.
  if (forecast === null) return null;
  const plans = forecast ? planWeekend(forecast.days, results) : null;

  return (
    <section aria-labelledby="vikend-naslov" className="rounded-[30px] bg-surface px-4 pt-[26px] pb-6 shadow-card sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-2 px-2">
        <h2 id="vikend-naslov" className="font-serif text-[clamp(26px,3vw,34px)] leading-tight">
          {t.weekend.title}
        </h2>
        <p className="text-[13px] text-muted">{forecast ? t.weekend.forecastFor(forecast.place ?? t.country) : t.weekend.loading}</p>
      </div>
      <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
        {plans
          ? plans.map((plan) => <DayPanel key={plan.day.date} plan={plan} tripFor={tripFor} onOpen={onOpen} />)
          : [0, 1].map((i) => <div key={i} className="h-[104px] animate-pulse rounded-3xl bg-page" aria-hidden />)}
      </div>
      <p className="mt-3 px-2 text-[11px] text-muted">
        {t.weather.source}{" "}
        <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
          Open-Meteo
        </a>
      </p>
    </section>
  );
}
