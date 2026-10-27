"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import BosniaMap from "@/components/BosniaMap";
import { activities } from "@/data/activities";
import { recommend } from "@/lib/recommend";
import type { Cost, Distance, Place, Preferences } from "@/lib/types";

interface FilterOption<T extends string> {
  value: T;
  label: string;
  icon?: string;
}

const placeOptions: FilterOption<Preferences["place"]>[] = [
  { value: "any", label: "Svejedno" },
  { value: "nature", label: "Priroda", icon: "🌲" },
  { value: "city", label: "Grad", icon: "🏙️" },
];
const coffeeOptions: FilterOption<Preferences["coffee"]>[] = [
  { value: "any", label: "Svejedno" },
  { value: "yes", label: "Da", icon: "☕" },
  { value: "no", label: "Ne" },
];
const distanceOptions: FilterOption<Preferences["distance"]>[] = [
  { value: "any", label: "Svejedno" },
  { value: "near", label: "Blizu", icon: "📍" },
  { value: "far", label: "Daleko", icon: "🚗" },
];
const budgetOptions: FilterOption<Preferences["budget"]>[] = [
  { value: "free", label: "Džabe", icon: "🆓" },
  { value: "moderate", label: "Umjereno", icon: "💶" },
  { value: "any", label: "Nebitno" },
];

/** A row of pill buttons; real radio inputs underneath keep it keyboard and screen-reader friendly. */
function FilterGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
        {legend}
      </legend>
      <div className="flex rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
        {options.map((o) => (
          <label key={o.value} className="flex-1">
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="peer sr-only"
            />
            <span className="block cursor-pointer rounded-full px-3 py-1.5 text-center text-sm font-medium whitespace-nowrap text-zinc-600 transition peer-checked:bg-zinc-800 peer-checked:text-white peer-checked:shadow peer-focus-visible:ring-2 peer-focus-visible:ring-rose-500 hover:text-zinc-900 peer-checked:hover:text-white dark:text-zinc-300 dark:peer-checked:bg-zinc-100 dark:peer-checked:text-zinc-900">
              {o.icon && (
                <span aria-hidden className="mr-1">
                  {o.icon}
                </span>
              )}
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const placeLabel: Record<Place, string> = { nature: "Priroda", city: "Grad" };
const distanceLabel: Record<Distance, string> = { near: "Blizu", far: "Daleko" };
const costLabel: Record<Cost, string> = { free: "Džabe", moderate: "Umjereno", expensive: "Skuplje" };

const SPIN_MS = 1000;

const noFilters: Preferences = { place: "any", coffee: "any", distance: "any", budget: "any" };

export default function Recommender() {
  const [prefs, setPrefs] = useState<Preferences>(noFilters);
  // The filters that were active when "Predloži" was last pressed; null until the first press,
  // so every activity flows by until then.
  const [applied, setApplied] = useState<Preferences | null>(null);
  const results = recommend(activities, applied ?? noFilters);
  // While true the cards spin very fast; the filters are applied when the spin ends.
  const [spinning, setSpinning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function suggest() {
    clearTimeout(timer.current);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setApplied(prefs);
      return;
    }
    setSpinning(true);
    timer.current = setTimeout(() => {
      setApplied(prefs);
      setSpinning(false);
    }, SPIN_MS);
  }

  return (
    <div className="space-y-8">
      <form
        className="mx-auto grid max-w-4xl gap-x-8 gap-y-5 rounded-3xl border border-white/60 bg-white/85 p-6 shadow-xl backdrop-blur-md md:grid-cols-2 dark:border-zinc-700/60 dark:bg-zinc-900/85"
        onSubmit={(e) => {
          e.preventDefault();
          suggest();
        }}
      >
        <FilterGroup
          legend="Priroda ili grad"
          name="place"
          options={placeOptions}
          value={prefs.place}
          onChange={(place) => setPrefs({ ...prefs, place })}
        />
        <FilterGroup
          legend="Kafa"
          name="coffee"
          options={coffeeOptions}
          value={prefs.coffee}
          onChange={(coffee) => setPrefs({ ...prefs, coffee })}
        />
        <FilterGroup
          legend="Daljina"
          name="distance"
          options={distanceOptions}
          value={prefs.distance}
          onChange={(distance) => setPrefs({ ...prefs, distance })}
        />
        <FilterGroup
          legend="Budžet"
          name="budget"
          options={budgetOptions}
          value={prefs.budget}
          onChange={(budget) => setPrefs({ ...prefs, budget })}
        />
        <button
          type="submit"
          disabled={spinning}
          className="mt-1 justify-self-center rounded-full bg-zinc-800 px-10 py-2.5 font-medium text-white transition hover:bg-zinc-700 active:scale-95 disabled:opacity-60 md:col-span-2 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Predloži
        </button>
      </form>

      <section aria-live="polite" className="marquee-viewport">
        {applied && results.length === 0 && (
          <p className="text-zinc-600 dark:text-zinc-400">
            Nema rezultata. Probaj promijeniti filtere.
          </p>
        )}
        {results.length > 0 && (
          // The list is rendered twice so the loop has no visible seam;
          // the track slides left by exactly one copy, then restarts.
          <div
            className={spinning ? "marquee-track marquee-spinning" : "marquee-track"}
            style={{ animationDuration: `${results.length * (spinning ? 0.1 : 6)}s` }}
          >
            {[0, 1].map((copy) =>
              results.map((a) => (
                <article
                  key={`${copy}-${a.id}`}
                  // The second copy is only visual: hide it from screen readers and keyboard focus.
                  inert={copy === 1}
                  className="flex w-[min(30rem,85vw)] shrink-0 flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/75 shadow-xl backdrop-blur-md dark:border-zinc-700/60 dark:bg-zinc-900/75"
                >
                  <div className="relative h-56 bg-gradient-to-br from-amber-400 via-rose-400 to-indigo-500">
                    {a.image ? (
                      <Image src={a.image} alt={a.title} fill sizes="30rem" className="object-cover" />
                    ) : (
                      <span className="absolute inset-0 grid place-items-center text-7xl" aria-hidden>
                        🧸
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-2xl font-semibold">{a.title}</h3>
                    <p className="mt-1 text-sm text-zinc-500">📍 {a.location}</p>
                    <p className="mt-2 text-base text-zinc-700 dark:text-zinc-300">{a.description}</p>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{a.info}</p>
                    <div className="mt-auto flex items-end justify-between gap-4 pt-3">
                      <p className="text-base text-zinc-500">
                        {placeLabel[a.place]} · {distanceLabel[a.distance]} · {costLabel[a.cost]}
                        {a.coffee && " · ☕ Kafa"}
                      </p>
                      {a.website && (
                        <a
                          href={a.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-sm font-medium text-rose-600 hover:underline dark:text-rose-400"
                        >
                          Web →
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              )),
            )}
          </div>
        )}
      </section>

      <section aria-label="Mapa Bosne i Hercegovine s lokacijama aktivnosti" className="mx-auto w-full max-w-4xl px-4">
        <BosniaMap activities={activities} highlightedIds={results.map((a) => a.id)} />
      </section>
    </div>
  );
}
