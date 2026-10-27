"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import BosniaMap from "@/components/BosniaMap";
import { activities } from "@/data/activities";
import { cities } from "@/data/cities";
import { noFilters, prefsToQuery } from "@/lib/filtersUrl";
import { isNear, NEAR_CITY_KM, recommend } from "@/lib/recommend";
import type { Activity, Cost, Distance, Place, Preferences } from "@/lib/types";

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
const settingOptions: FilterOption<Preferences["setting"]>[] = [
  { value: "any", label: "Svejedno" },
  { value: "indoor", label: "Unutra", icon: "🌧️" },
  { value: "outdoor", label: "Vani", icon: "☀️" },
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
  { value: "any", label: "Nebitno" },
  { value: "free", label: "Džabe", icon: "🆓" },
  { value: "moderate", label: "Umjereno", icon: "💶" },
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

/** "Pronađena 1 aktivnost", "Pronađene 3 aktivnosti", "Pronađeno 5 aktivnosti" (Bosnian plural forms). */
function resultsText(count: number, nearCity: boolean): string {
  if (count === 0) return nearCity ? `Nijedna aktivnost u krugu od ${NEAR_CITY_KM} km.` : "Nijedna aktivnost ne odgovara filterima.";
  const lastDigit = count % 10;
  const lastTwo = count % 100;
  if (lastDigit === 1 && lastTwo !== 11) return `Pronađena ${count} aktivnost`;
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14)) return `Pronađene ${count} aktivnosti`;
  return `Pronađeno ${count} aktivnosti`;
}

const SPIN_MS = 1000;

interface CardProps {
  a: Activity;
  /** Copies used only to make the loop seamless are hidden from screen readers and keyboard focus. */
  hidden?: boolean;
  active?: boolean;
  onHover?: (id: string | null) => void;
}

function ActivityCard({ a, hidden = false, active = false, onHover }: CardProps) {
  return (
    <article
      id={hidden ? undefined : `card-${a.id}`}
      inert={hidden}
      onMouseEnter={() => onHover?.(a.id)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(a.id)}
      onBlur={() => onHover?.(null)}
      className={`flex w-[min(30rem,85vw)] shrink-0 snap-center flex-col overflow-hidden rounded-2xl border bg-white/75 shadow-xl backdrop-blur-md transition dark:bg-zinc-900/75 ${active ? "border-rose-500 ring-4 ring-rose-500/60" : "border-white/60 dark:border-zinc-700/60"}`}
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
            {placeLabel[a.place]} · {a.indoor ? "Unutra" : "Vani"} · {distanceLabel[a.distance]} · {costLabel[a.cost]}
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
  );
}

const arrowButton =
  "absolute top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-2xl text-zinc-800 shadow-lg backdrop-blur transition hover:bg-white active:scale-95 dark:bg-zinc-800/90 dark:text-zinc-100";

/** Puts the filters in the address bar so the page can be shared; no filters means a clean URL. */
function writeFiltersToUrl(prefs: Preferences | null) {
  const query = prefs ? prefsToQuery(prefs) : "";
  window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
}

export default function Recommender({ initialPrefs }: { initialPrefs: Preferences | null }) {
  const [prefs, setPrefs] = useState<Preferences>(initialPrefs ?? noFilters);
  // The filters that were active when "Predloži" was last pressed; null until the first press,
  // so every activity flows by until then. A shared link starts with its filters applied.
  const [applied, setApplied] = useState<Preferences | null>(initialPrefs);
  // City picked on the map: only activities around it are shown, on top of the other filters.
  const [cityName, setCityName] = useState<string | null>(null);
  const city = cities.find((c) => c.name === cityName);
  const results = recommend(activities, applied ?? noFilters).filter((a) => !city || isNear(a, city.coordinates));
  // While true the cards spin very fast; the filters are applied when the spin ends.
  const [spinning, setSpinning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Set when a map dot is clicked before any search, to stop the flow and show that card.
  const [browsing, setBrowsing] = useState(false);
  // The cards flow until "Predloži" is first pressed; after the spin they stand still and can be scrolled.
  const flowing = spinning || (applied === null && !browsing);

  // The activity highlighted on both the map and the cards (hovered, focused or picked on the map).
  const [activeId, setActiveId] = useState<string | null>(null);
  // A card to bring into view once the scrollable row has rendered.
  const pendingScroll = useRef<string | null>(null);

  const scroller = useRef<HTMLDivElement>(null);
  // Whether the scrollable row can move further left/right; the arrow buttons hide at the ends.
  const [canScroll, setCanScroll] = useState({ left: false, right: false });

  function updateCanScroll() {
    const el = scroller.current;
    if (!el) return;
    setCanScroll({
      left: el.scrollLeft > 1,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
    });
  }

  function scrollCards(direction: 1 | -1) {
    const el = scroller.current;
    el?.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  function showCard(id: string) {
    document.getElementById(`card-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  // Re-check the arrows whenever the row or its cards change size (also fires once on start),
  // and scroll to a card picked on the map while the cards were still flowing.
  useEffect(() => {
    const el = scroller.current;
    if (flowing || !el) return;
    if (pendingScroll.current) {
      showCard(pendingScroll.current);
      pendingScroll.current = null;
    }
    const observer = new ResizeObserver(updateCanScroll);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => observer.disconnect();
  }, [flowing, results.length]);

  function suggest() {
    clearTimeout(timer.current);
    writeFiltersToUrl(prefs);
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

  function reset() {
    clearTimeout(timer.current);
    setPrefs(noFilters);
    setApplied(null);
    setSpinning(false);
    setBrowsing(false);
    setCityName(null);
    writeFiltersToUrl(null);
  }

  /** A city badge was clicked: show only activities around it, or everything again on a second click. */
  function selectCity(name: string) {
    if (spinning) return;
    setCityName(name === cityName ? null : name);
    setActiveId(null);
    setBrowsing(true);
  }

  /** A map dot was clicked: highlight its card and bring it into view. */
  function selectActivity(id: string) {
    if (spinning || !results.some((a) => a.id === id)) return;
    setActiveId(id);
    if (flowing) {
      pendingScroll.current = id;
      setBrowsing(true);
    } else {
      showCard(id);
    }
  }

  return (
    <div className="space-y-8">
      <form
        className="mx-auto grid max-w-5xl gap-x-8 gap-y-5 rounded-3xl border border-white/60 bg-white/85 p-6 shadow-xl backdrop-blur-md md:grid-cols-2 lg:grid-cols-3 dark:border-zinc-700/60 dark:bg-zinc-900/85"
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
          legend="Unutra ili vani"
          name="setting"
          options={settingOptions}
          value={prefs.setting}
          onChange={(setting) => setPrefs({ ...prefs, setting })}
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
          className="self-end justify-self-center rounded-full bg-zinc-800 px-10 py-2.5 font-medium text-white transition hover:bg-zinc-700 active:scale-95 disabled:opacity-60 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Predloži
        </button>
      </form>

      {(applied || city) && !spinning && (
        <div className="flex flex-wrap items-center justify-center gap-3" aria-live="polite">
          <p className="rounded-full bg-white/80 px-4 py-1.5 font-medium text-zinc-800 shadow backdrop-blur dark:bg-zinc-900/80 dark:text-zinc-100">
            {resultsText(results.length, !!city)}
          </p>
          {city && (
            <button
              type="button"
              onClick={() => setCityName(null)}
              aria-label={`Prikaži aktivnosti i izvan okoline grada ${city.name}`}
              className="rounded-full bg-rose-600 px-4 py-1.5 text-sm font-medium text-white shadow transition hover:bg-rose-700"
            >
              📍 {city.name} ✕
            </button>
          )}
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-zinc-300 bg-white/80 px-4 py-1.5 text-sm font-medium text-zinc-700 shadow backdrop-blur transition hover:bg-white dark:border-zinc-600 dark:bg-zinc-900/80 dark:text-zinc-200"
          >
            ✕ Poništi
          </button>
        </div>
      )}

      <section className={flowing ? "marquee-viewport" : "relative"}>
        {results.length > 0 && flowing && (
          // The list is rendered twice so the loop has no visible seam;
          // the track slides left by exactly one copy, then restarts.
          <div
            className={spinning ? "marquee-track marquee-spinning" : "marquee-track"}
            style={{ animationDuration: `${results.length * (spinning ? 0.1 : 6)}s` }}
          >
            {[0, 1].map((copy) =>
              results.map((a) => (
                <ActivityCard
                  key={`${copy}-${a.id}`}
                  a={a}
                  hidden={copy === 1}
                  active={a.id === activeId}
                  onHover={setActiveId}
                />
              )),
            )}
          </div>
        )}
        {results.length > 0 && !flowing && (
          <>
            <div
              ref={scroller}
              onScroll={updateCanScroll}
              // Scrollbar hidden; the row still scrolls by swipe, trackpad, Shift+wheel and the arrows.
              className="snap-x snap-mandatory overflow-x-auto scroll-px-6 px-6 py-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {/* w-max + mx-auto centres a short row and lets a long one scroll */}
              <div className="mx-auto flex w-max gap-8">
                {results.map((a) => (
                  <ActivityCard key={a.id} a={a} active={a.id === activeId} onHover={setActiveId} />
                ))}
              </div>
            </div>
            {canScroll.left && (
              <button type="button" aria-label="Prethodne aktivnosti" onClick={() => scrollCards(-1)} className={`${arrowButton} left-3`}>
                ‹
              </button>
            )}
            {canScroll.right && (
              <button type="button" aria-label="Sljedeće aktivnosti" onClick={() => scrollCards(1)} className={`${arrowButton} right-3`}>
                ›
              </button>
            )}
          </>
        )}
      </section>

      <section aria-label="Mapa Bosne i Hercegovine s lokacijama aktivnosti" className="mx-auto w-full max-w-[70rem] px-4">
        <BosniaMap
          activities={activities}
          highlightedIds={results.map((a) => a.id)}
          activeId={activeId}
          onSelect={selectActivity}
          onHover={setActiveId}
          selectedCity={cityName}
          onSelectCity={selectCity}
        />
      </section>
    </div>
  );
}
