"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { activities } from "@/data/activities";
import { recommend } from "@/lib/recommend";
import type { Cost, Distance, Place, Preferences } from "@/lib/types";

const field =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

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
        className="mx-auto grid max-w-4xl grid-cols-2 gap-4 rounded-2xl border border-white/60 bg-white/75 p-4 shadow-lg backdrop-blur-md md:grid-cols-4 dark:border-zinc-700/60 dark:bg-zinc-900/75"
        onSubmit={(e) => {
          e.preventDefault();
          suggest();
        }}
      >
        <label className="block text-sm font-medium">
          Priroda ili grad
          <select
            className={field}
            value={prefs.place}
            onChange={(e) => setPrefs({ ...prefs, place: e.target.value as Preferences["place"] })}
          >
            <option value="any">Svejedno</option>
            <option value="nature">Priroda</option>
            <option value="city">Grad</option>
          </select>
        </label>
        <label className="block text-sm font-medium">
          Kafa
          <select
            className={field}
            value={prefs.coffee}
            onChange={(e) => setPrefs({ ...prefs, coffee: e.target.value as Preferences["coffee"] })}
          >
            <option value="any">Svejedno</option>
            <option value="yes">Da</option>
            <option value="no">Ne</option>
          </select>
        </label>
        <label className="block text-sm font-medium">
          Daljina
          <select
            className={field}
            value={prefs.distance}
            onChange={(e) =>
              setPrefs({ ...prefs, distance: e.target.value as Preferences["distance"] })
            }
          >
            <option value="any">Svejedno</option>
            <option value="near">Blizu</option>
            <option value="far">Daleko</option>
          </select>
        </label>
        <label className="block text-sm font-medium">
          Budžet
          <select
            className={field}
            value={prefs.budget}
            onChange={(e) => setPrefs({ ...prefs, budget: e.target.value as Preferences["budget"] })}
          >
            <option value="free">Džabe</option>
            <option value="moderate">Umjereno</option>
            <option value="any">Nebitno</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={spinning}
          className="col-span-2 justify-self-center rounded-lg bg-zinc-800 px-8 py-2 font-medium text-white transition hover:bg-zinc-700 active:scale-95 disabled:opacity-60 md:col-span-4 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
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
                  <div className="relative h-44 bg-gradient-to-br from-amber-400 via-rose-400 to-indigo-500">
                    {a.image ? (
                      <Image src={a.image} alt={a.title} fill sizes="30rem" className="object-cover" />
                    ) : (
                      <span className="absolute inset-0 grid place-items-center text-7xl" aria-hidden>
                        🧸
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-3xl font-semibold">{a.title}</h3>
                    <p className="mt-1 text-sm text-zinc-500">📍 {a.location}</p>
                    <p className="mt-4 text-lg text-zinc-700 dark:text-zinc-300">{a.description}</p>
                    <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">{a.info}</p>
                    <div className="mt-auto flex items-end justify-between gap-4 pt-6">
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
                    {a.imageCredit && (
                      <p className="mt-3 text-xs text-zinc-400">
                        Foto:{" "}
                        <a href={a.imageCredit.source} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {a.imageCredit.author}
                        </a>
                        , {a.imageCredit.license}
                      </p>
                    )}
                  </div>
                </article>
              )),
            )}
          </div>
        )}
      </section>
    </div>
  );
}
