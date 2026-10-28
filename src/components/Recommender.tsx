"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import BosniaMap from "@/components/BosniaMap";
import FilterModal, { SlidersIcon } from "@/components/FilterModal";
import MapTeaser from "@/components/MapTeaser";
import StartLocationPicker from "@/components/StartLocationPicker";
import WeatherWidget from "@/components/WeatherWidget";
import { activities } from "@/data/activities";
import { cities } from "@/data/cities";
import { noFilters, prefsToQuery } from "@/lib/filtersUrl";
import { distanceKm, isNear, NEAR_CITY_KM, recommend } from "@/lib/recommend";
import { formatKm, useStartLocation } from "@/lib/startLocation";
import type { Activity, Cost, Place, Preferences } from "@/lib/types";

const placeLabel: Record<Place, string> = { nature: "Priroda", city: "Grad" };
const costLabel: Record<Cost, string> = { free: "Besplatno", moderate: "Umjereno", expensive: "Skuplje" };

/** Activities offered as the round thumbnails on the featured card. */
const HERO_PICKS = ["kravice", "vrelo-bosne", "trebevic-hiking"];
/** Cards shown before "Prikaži sve". */
const FIRST_CARDS = 8;
const SHUFFLE_MS = 900;
const SHUFFLE_STEP_MS = 90;

/** How many filters are set, for the badge on the "Filteri" button. */
function filterCount(prefs: Preferences, hasStart: boolean): number {
  return [
    prefs.place !== "any",
    prefs.setting !== "any",
    prefs.distance !== "any",
    prefs.budget !== "any",
    prefs.coffee !== "any",
    // The kilometre limit does nothing without a starting point, so it is not counted then.
    prefs.radius !== "any" && hasStart,
  ].filter(Boolean).length;
}

/** "Pronađena 1 aktivnost", "Pronađene 3 aktivnosti", "Pronađeno 5 aktivnosti" (Bosnian plural forms). */
function resultsText(count: number, nearCity: boolean): string {
  if (count === 0) return nearCity ? `Nijedna aktivnost u krugu od ${NEAR_CITY_KM} km.` : "Nijedna aktivnost ne odgovara odabiru.";
  const lastDigit = count % 10;
  const lastTwo = count % 100;
  if (lastDigit === 1 && lastTwo !== 11) return `Pronađena ${count} aktivnost`;
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14)) return `Pronađene ${count} aktivnosti`;
  return `Pronađeno ${count} aktivnosti`;
}

/** Lower case without accents, so "cevapi" finds "Ćevapi" and "dzamija" finds "džamija". */
function fold(text: string): string {
  return text.toLocaleLowerCase("bs").replaceAll("đ", "dj").normalize("NFD").replace(/\p{M}/gu, "");
}

function writeFiltersToUrl(prefs: Preferences) {
  const query = prefsToQuery(prefs);
  window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
}

function Arrow({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function LongArrow() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

const roundButton = "grid size-[38px] shrink-0 place-items-center rounded-full bg-page text-ink shadow-soft transition hover:-translate-y-0.5";
const card = "rounded-[30px] bg-surface shadow-card";

/** Photo of an activity, or a soft placeholder for the ones without a picture yet. */
function Photo({ a, sizes, className = "", eager = false }: { a: Activity; sizes: string; className?: string; eager?: boolean }) {
  return a.image ? (
    <Image src={a.image} alt={a.title} fill sizes={sizes} loading={eager ? "eager" : undefined} className={`object-cover ${className}`} />
  ) : (
    <span
      className={`absolute inset-0 grid place-items-center bg-[linear-gradient(140deg,color-mix(in_srgb,var(--soft)_45%,var(--surface)),var(--surface))] text-4xl ${className}`}
      aria-hidden
    >
      {a.place === "nature" ? "🌲" : "🏛️"}
    </span>
  );
}

function Tag({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "free" | "km" }) {
  const tones = {
    plain: "bg-page text-muted",
    free: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
    km: "bg-accent/12 font-medium text-accent",
  };
  return <span className={`rounded-full px-2.5 py-0.5 ${tones[tone]}`}>{children}</span>;
}

interface PlaceCardProps {
  a: Activity;
  active: boolean;
  fromKm?: number;
  onHover: (id: string | null) => void;
  onFeature: (id: string) => void;
}

function PlaceCard({ a, active, fromKm, onHover, onFeature }: PlaceCardProps) {
  return (
    <article
      id={`card-${a.id}`}
      onMouseEnter={() => onHover(a.id)}
      onMouseLeave={() => onHover(null)}
      className={`flex flex-col rounded-3xl border bg-surface px-2 pt-2 pb-4 shadow-soft transition ${active ? "border-accent ring-2 ring-accent" : "border-line"}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[18px]">
        <Photo a={a} sizes="(min-width: 1080px) 18rem, (min-width: 640px) 45vw, 90vw" />
      </div>
      <div className="flex items-center justify-between gap-2 px-2 pt-3.5">
        <div className="min-w-0">
          <h3 className="font-medium">{a.title}</h3>
          <p className="text-[13px] text-muted">{a.location}</p>
        </div>
        <button type="button" onClick={() => onFeature(a.id)} aria-label={`Istakni: ${a.title}`} className={roundButton}>
          <Arrow />
        </button>
      </div>
      <p className="line-clamp-2 px-2 pt-2 text-[13px] text-muted">{a.description}</p>
      <div className="mt-auto flex flex-wrap gap-1.5 px-2 pt-2.5 text-xs">
        {fromKm !== undefined && <Tag tone="km">{formatKm(fromKm)}</Tag>}
        <Tag>{placeLabel[a.place]}</Tag>
        <Tag tone={a.cost === "free" ? "free" : "plain"}>{costLabel[a.cost]}</Tag>
        {a.coffee && <Tag>☕ Kafa</Tag>}
      </div>
    </article>
  );
}

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-[13px] font-medium shadow-[inset_0_1px_0_var(--rim),0_1px_3px_rgba(40,52,80,.08)] transition ${pressed ? "bg-ink text-surface" : "bg-page text-ink hover:bg-line/60"}`}
    >
      {children}
    </button>
  );
}

/** Big category tile with a coloured pictogram, toggling one quick filter. */
function CategoryTile({ pressed, onClick, label, children }: { pressed: boolean; onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`grid justify-items-center gap-2 rounded-[26px] bg-surface px-1.5 pt-[18px] pb-3.5 text-[13px] shadow-card transition hover:-translate-y-0.5 ${pressed ? "outline-2 outline-accent" : ""}`}
    >
      <svg viewBox="0 0 40 40" className="size-9" aria-hidden>
        {children}
      </svg>
      {label}
    </button>
  );
}

export default function Recommender({ initialPrefs }: { initialPrefs: Preferences | null }) {
  // Filters apply straight away; they are also kept in the address bar so the page can be shared.
  const [prefs, setPrefsState] = useState<Preferences>(initialPrefs ?? noFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState("");
  // City picked on the map: only activities around it are shown, on top of the other filters.
  const [cityName, setCityName] = useState<string | null>(null);
  const city = cities.find((c) => c.name === cityName);
  const start = useStartLocation();
  const kmFromStart = (a: Activity) => (start ? distanceKm(start.coordinates, a.coordinates) : undefined);

  const folded = fold(query.trim());
  const matching = (p: Preferences) => {
    const list = recommend(activities, p, start?.coordinates).filter(
      (a) => (!city || isNear(a, city.coordinates)) && (!folded || fold(`${a.title} ${a.location} ${a.tags.join(" ")}`).includes(folded)),
    );
    // With a starting point, the closest activities come first.
    return start ? list.sort((x, y) => kmFromStart(x)! - kmFromStart(y)!) : list;
  };
  const results = matching(prefs);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? results : results.slice(0, FIRST_CARDS);

  // The activity in the big card at the top, and why it is there.
  const [featuredId, setFeaturedId] = useState(HERO_PICKS[0]);
  const [suggested, setSuggested] = useState(false);
  const featured = activities.find((a) => a.id === featuredId) ?? activities[0];
  const thumbs = HERO_PICKS.includes(featured.id) ? HERO_PICKS : [featured.id, ...HERO_PICKS.slice(0, 2)];
  // While true, "Predloži" is flicking through the results before it settles on one.
  const [shuffling, setShuffling] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // The activity highlighted on both the map and the cards (hovered, or picked on the map).
  const [activeId, setActiveId] = useState<string | null>(null);

  const nearest = start && results[0];

  function setPrefs(next: Preferences) {
    setPrefsState(next);
    writeFiltersToUrl(next);
  }

  function toggle<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setPrefs({ ...prefs, [key]: prefs[key] === value ? "any" : value });
  }

  function reset() {
    setPrefs(noFilters);
    setCityName(null);
    setQuery("");
  }

  /** Puts an activity in the big card and scrolls up to it. */
  function feature(id: string, bySuggestion = false) {
    setFeaturedId(id);
    setSuggested(bySuggestion);
    document.getElementById("istaknuto")?.scrollIntoView({ block: "center" });
  }

  /** Brings an activity's card into view, opening the full list first if it is further down. */
  function showCard(id: string) {
    const index = results.findIndex((a) => a.id === id);
    if (index < 0) return false;
    if (index >= FIRST_CARDS && !showAll) flushSync(() => setShowAll(true));
    setActiveId(id);
    document.getElementById(`card-${id}`)?.scrollIntoView({ block: "center" });
    return true;
  }

  /** "Predloži": flick through random results for a moment, then settle on one in the big card. */
  function suggest() {
    if (shuffling || results.length === 0) return;
    const pool = results.length > 1 ? results.filter((a) => a.id !== featuredId) : results;
    const pick = () => pool[Math.floor(Math.random() * pool.length)].id;
    document.getElementById("istaknuto")?.scrollIntoView({ block: "center" });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      feature(pick(), true);
      return;
    }
    setShuffling(true);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    for (let t = 0; t < SHUFFLE_MS; t += SHUFFLE_STEP_MS) {
      timers.current.push(setTimeout(() => setFeaturedId(pick()), t));
    }
    timers.current.push(
      setTimeout(() => {
        setFeaturedId(pick());
        setSuggested(true);
        setShuffling(false);
      }, SHUFFLE_MS),
    );
  }

  /** A city badge was clicked: show only activities around it, or everything again on a second click. */
  function selectCity(name: string) {
    setCityName(name === cityName ? null : name);
    setActiveId(null);
  }

  const activeFilters = filterCount(prefs, !!start);
  const anythingSet = activeFilters > 0 || !!city || !!folded;
  const featuredKm = kmFromStart(featured);
  const inResults = results.some((a) => a.id === featured.id);

  return (
    <div className="space-y-6">
      {/* Organic clip shape for the featured card, in bounding-box units so it stretches with the card */}
      <svg width="0" height="0" className="absolute" aria-hidden>
        <clipPath id="blob-hero" clipPathUnits="objectBoundingBox">
          <path d="M0.03,0.14 C0.05,0.03 0.16,0.04 0.3,0.06 C0.45,0.08 0.55,0 0.7,0.02 C0.83,0.04 0.85,0.15 0.89,0.25 C0.93,0.34 1,0.37 0.99,0.5 C0.98,0.62 0.91,0.66 0.93,0.78 C0.95,0.9 0.88,1 0.74,0.99 C0.55,0.98 0.4,0.95 0.2,0.98 C0.07,1 0.01,0.93 0.01,0.8 C0.01,0.6 0.015,0.3 0.03,0.14 Z" />
        </clipPath>
      </svg>

      <header className="flex flex-wrap items-center gap-6">
        <div className="min-w-0 flex-[1_1_320px]">
          <h1 className="text-[clamp(28px,3.4vw,40px)] leading-tight font-semibold tracking-tight">Zdravo, porodico 👋</h1>
          <p className="mt-1.5 text-[17px] text-muted">
            Otkrij zadivljujuća odredišta, stvori nezaboravne uspomene i doživi ljepotu naše zemlje – putovanje po putovanje.
          </p>
        </div>
        <label className="flex flex-[0_1_300px] items-center gap-2.5 rounded-full bg-surface px-5 py-3.5 shadow-card focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
          <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <circle cx={11} cy={11} r={7} />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pretraži aktivnosti..."
            aria-label="Pretraži aktivnosti"
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted"
          />
        </label>
        <div
          className="hidden size-16 shrink-0 place-items-center rounded-full border-4 border-rim bg-[linear-gradient(160deg,#f6d27a,#e98c63)] text-white shadow-soft sm:grid"
          aria-hidden
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
            <circle cx={8} cy={7} r={3} />
            <circle cx={16} cy={7} r={3} />
            <circle cx={12} cy={13.5} r={2.2} />
            <path d="M2.5 21c0-4 2.4-7 5.5-7 1 0 1.9.3 2.6.8-.9.9-1.4 2.2-1.4 3.7V21zm19 0c0-4-2.4-7-5.5-7-1 0-1.9.3-2.6.8.9.9 1.4 2.2 1.4 3.7V21zM9.6 21v-1.5c0-1.8 1.1-3 2.4-3s2.4 1.2 2.4 3V21z" />
          </svg>
        </div>
      </header>

      <section className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_270px]">
        {/* Featured activity: a photo inside a white rim, both cut to the same organic shape */}
        <div id="istaknuto" className="drop-shadow-[0_14px_24px_rgba(40,52,80,.16)]">
          <div className="blob bg-rim p-3">
            <article className="blob relative flex min-h-[470px] flex-col bg-[#3a6ea8] text-white sm:min-h-[520px]" aria-live="polite">
              <Photo key={featured.id} a={featured} eager sizes="(min-width: 1024px) 50rem, 100vw" className={shuffling ? "" : "hero-photo"} />
              <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(14,34,66,.75)_0%,rgba(14,34,66,.38)_45%,rgba(14,34,66,0)_72%)]" />
              <div className={`relative max-w-[460px] px-[30px] pt-[46px] transition sm:px-14 sm:pt-[70px] ${shuffling ? "blur-[2px]" : ""}`}>
                <p className="text-xs font-medium tracking-[0.22em] uppercase opacity-90">
                  {shuffling ? "Biramo…" : suggested ? "Naš prijedlog" : "Izlet sedmice"}
                </p>
                <h2 className="mt-3.5 font-serif text-[clamp(40px,5.2vw,64px)] leading-none">{featured.title}</h2>
                <p className="mt-1.5 font-serif text-[22px] sm:text-[26px]">{featured.location}</p>
                <p className="mt-4 line-clamp-3 max-w-[34ch] opacity-95">{featured.description}</p>
                <p className="mt-3 text-sm opacity-90">
                  {featuredKm !== undefined && `${formatKm(featuredKm)} od vas · `}
                  {featured.indoor ? "Unutra" : "Vani"} · {costLabel[featured.cost]}
                  {featured.coffee && " · ☕ Kafa"}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    // Filtered out of the cards: show where it is on the map instead.
                    if (!showCard(featured.id)) document.getElementById("mapa")?.scrollIntoView({ block: "start" });
                  }}
                  className="mt-6 inline-flex items-center gap-3 rounded-full border-2 border-white/85 bg-[rgba(20,48,90,.55)] px-[26px] py-3 font-medium backdrop-blur-sm transition hover:bg-[rgba(20,48,90,.75)]"
                >
                  {inResults ? "Pogledaj izlet" : "Pogledaj na mapi"}
                  <LongArrow />
                </button>
              </div>
              {/* In the flow under the text (not pinned to the corner), so a long description never runs into them */}
              <div
                role="group"
                aria-label="Izaberi istaknuti izlet"
                className="relative mt-auto flex items-center gap-2.5 px-[26px] pt-6 pb-[26px] sm:px-11 sm:pb-[34px]"
              >
                {thumbs.map((id) => {
                  const a = activities.find((x) => x.id === id)!;
                  const pressed = id === featured.id;
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-label={a.title}
                      aria-pressed={pressed}
                      onClick={() => feature(id)}
                      className={`relative overflow-hidden rounded-full shadow-[0_4px_10px_rgba(0,0,0,.25)] transition hover:-translate-y-0.5 ${pressed ? "size-[72px] border-4 border-white" : "size-[58px] border-[3px] border-white/75"}`}
                    >
                      <Photo a={a} sizes="72px" />
                    </button>
                  );
                })}
              </div>
            </article>
          </div>
        </div>

        <aside className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-1">
          <p
            className="flex items-center justify-center gap-1.5 pt-1.5 pl-3 font-script text-[54px] leading-[.9] text-accent sm:col-span-2 lg:col-span-1 lg:-rotate-[8deg] lg:justify-start"
            aria-hidden
          >
            Hajmo van!
            <svg width="40" height="40" viewBox="0 0 40 40" className="shrink-0">
              <circle cx={20} cy={20} r={7} className="fill-sun" />
              <g className="stroke-sun" strokeWidth={2.5} strokeLinecap="round">
                <path d="M20 4v5M20 31v5M4 20h5M31 20h5M8.7 8.7l3.5 3.5M27.8 27.8l3.5 3.5M8.7 31.3l3.5-3.5M27.8 12.2l3.5-3.5" />
              </g>
            </svg>
          </p>
          <WeatherWidget />
          <div className={`${card} p-5`}>
            <h3 className="mb-3.5 font-serif text-[21px]">Polazište</h3>
            <StartLocationPicker location={start} />
            {nearest && (
              <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-[14px]">
                  <Photo a={nearest} sizes="56px" />
                </div>
                <p className="min-w-0 flex-1 text-[13px] text-muted">
                  Najbliže
                  <strong className="block truncate text-[15px] font-medium text-ink">{nearest.title}</strong>
                  {formatKm(kmFromStart(nearest)!)} od vas
                </p>
                <button type="button" onClick={() => feature(nearest.id)} aria-label={`Istakni: ${nearest.title}`} className={roundButton}>
                  <Arrow />
                </button>
              </div>
            )}
          </div>
        </aside>
      </section>

      <section id="aktivnosti" aria-labelledby="aktivnosti-naslov" className={`${card} scroll-mt-6 px-4 pt-[26px] pb-6 sm:px-6`}>
        <div className="flex flex-wrap items-end justify-between gap-4 px-2">
          <div>
            <h2 id="aktivnosti-naslov" className="font-serif text-[clamp(26px,3vw,34px)] leading-tight">
              Aktivnosti za porodice
            </h2>
            <p className="mt-1 text-muted" aria-live="polite">
              {resultsText(results.length, !!city)}
              {start && results.length > 0 && `, najbliže od mjesta ${start.name} prvo`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Brzi filteri">
            <Chip pressed={prefs.place === "any"} onClick={() => setPrefs({ ...prefs, place: "any" })}>
              Sve
            </Chip>
            <Chip pressed={prefs.place === "nature"} onClick={() => toggle("place", "nature")}>
              Priroda
            </Chip>
            <Chip pressed={prefs.place === "city"} onClick={() => toggle("place", "city")}>
              Grad
            </Chip>
            <Chip pressed={prefs.budget === "free"} onClick={() => toggle("budget", "free")}>
              Besplatno
            </Chip>
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-[13px] font-medium shadow-soft"
            >
              <SlidersIcon />
              Filteri
              {activeFilters > 0 && (
                <span className="grid size-5 place-items-center rounded-full bg-ink text-[11px] text-surface">{activeFilters}</span>
              )}
            </button>
          </div>
        </div>

        {anythingSet && (
          <div className="mt-4 flex flex-wrap items-center gap-2 px-2 text-[13px]">
            {city && (
              <button
                type="button"
                onClick={() => setCityName(null)}
                aria-label={`Prikaži aktivnosti i izvan okoline grada ${city.name}`}
                className="rounded-full bg-accent/12 px-3 py-1 font-medium text-accent"
              >
                Kod: {city.name} ✕
              </button>
            )}
            {folded && (
              <button type="button" onClick={() => setQuery("")} className="rounded-full bg-accent/12 px-3 py-1 font-medium text-accent">
                „{query.trim()}“ ✕
              </button>
            )}
            <button type="button" onClick={reset} className="rounded-full px-3 py-1 font-medium text-muted hover:text-ink">
              Poništi sve
            </button>
          </div>
        )}

        <div className="mt-5 grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((a) => (
            <PlaceCard key={a.id} a={a} active={a.id === activeId} fromKm={kmFromStart(a)} onHover={setActiveId} onFeature={feature} />
          ))}
          {results.length === 0 && <p className="col-span-full py-10 text-center text-muted">{resultsText(0, !!city)}</p>}
        </div>
        {results.length > FIRST_CARDS && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="rounded-full bg-page px-6 py-2.5 text-sm font-medium shadow-[inset_0_1px_0_var(--rim),0_1px_3px_rgba(40,52,80,.08)]"
            >
              {showAll ? "Prikaži manje" : `Prikaži sve (${results.length})`}
            </button>
          </div>
        )}
      </section>

      {filtersOpen && (
        <FilterModal
          initial={prefs}
          countFor={(p) => matching(p).length}
          startName={start?.name}
          onClose={() => setFiltersOpen(false)}
          onApply={(next) => {
            setPrefs(next);
            setFiltersOpen(false);
          }}
        />
      )}

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="grid content-start gap-[18px]">
          <figure className="relative m-0 min-h-[250px] overflow-hidden rounded-[34px] border-8 border-rim text-white shadow-soft">
            <Image src="/activities/trebevic-hiking.jpg" alt="" fill sizes="(min-width: 1024px) 34rem, 100vw" className="object-cover object-[center_60%]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(14,34,66,.7),rgba(14,34,66,.1)_75%)]" />
            <div className="relative max-w-[360px] px-[34px] py-[30px]">
              <p className="font-serif text-[22px]">Za inspiraciju</p>
              <blockquote className="mt-[18px] font-serif text-[26px] leading-tight">„Najljepše uspomene nastaju zajedno, napolju.“</blockquote>
              <figcaption className="mt-2.5 text-[13px] opacity-85">Family Time</figcaption>
            </div>
          </figure>
          <div className={`${card} flex flex-wrap items-center gap-4 px-4 py-3.5 sm:flex-nowrap`}>
            <div className="relative h-16 w-[76px] shrink-0 overflow-hidden rounded-2xl">
              <Photo a={suggested ? featured : activities.find((a) => a.id === "stari-most")!} sizes="76px" />
            </div>
            <p className="min-w-0 flex-1">
              <strong className="block font-medium">Ne znate kuda?</strong>
              <span className="text-[13px] text-muted">
                {suggested && !shuffling ? `Kako bi bilo: ${featured.title}?` : "Pustite nas da predložimo izlet."}
              </span>
            </p>
            <button
              type="button"
              onClick={suggest}
              disabled={shuffling || results.length === 0}
              className="flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 font-medium text-surface shadow-soft transition active:scale-[0.97] disabled:opacity-60 sm:w-auto"
            >
              <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                <rect x={3} y={3} width={18} height={18} rx={4} />
                <circle cx={8.5} cy={8.5} r={1.2} fill="currentColor" />
                <circle cx={15.5} cy={15.5} r={1.2} fill="currentColor" />
                <circle cx={12} cy={12} r={1.2} fill="currentColor" />
              </svg>
              Predloži
            </button>
          </div>
        </div>

        <div className="grid content-start gap-[18px]">
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4" role="group" aria-label="Kategorije">
            <CategoryTile pressed={prefs.place === "nature"} onClick={() => toggle("place", "nature")} label="Priroda">
              <path d="M20 4 8 22h7L9 32h22l-6-10h7z" fill="#4f9a62" />
              <rect x={18} y={31} width={4} height={6} rx={1} fill="#8a5a3b" />
            </CategoryTile>
            <CategoryTile pressed={prefs.place === "city"} onClick={() => toggle("place", "city")} label="Grad">
              <path d="M4 30c4-10 9-15 16-15s12 5 16 15" fill="none" stroke="#c99a5b" strokeWidth={5} strokeLinecap="round" />
              <path d="M2 32h36" className="stroke-accent" strokeWidth={4} strokeLinecap="round" />
            </CategoryTile>
            <CategoryTile pressed={prefs.budget === "free"} onClick={() => toggle("budget", "free")} label="Besplatno">
              <circle cx={20} cy={20} r={15} className="fill-sun" />
              <text x={20} y={25} textAnchor="middle" fontSize={13} fontWeight={700} fill="#14305a">
                0 KM
              </text>
            </CategoryTile>
            <CategoryTile pressed={prefs.coffee === "yes"} onClick={() => toggle("coffee", "yes")} label="Uz kafu">
              <path d="M8 14h20v10a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8z" className="fill-accent" />
              <path d="M28 17h3a4 4 0 0 1 0 8h-3" fill="none" className="stroke-accent" strokeWidth={3} />
              <path d="M14 4c-2 3 2 4 0 7M20 4c-2 3 2 4 0 7" fill="none" stroke="#c99a5b" strokeWidth={2} strokeLinecap="round" />
            </CategoryTile>
          </div>

          <div className="relative min-h-[260px] overflow-hidden rounded-[30px] border-8 border-rim bg-[linear-gradient(140deg,color-mix(in_srgb,var(--soft)_22%,var(--surface)),var(--surface)_70%)] px-[30px] py-7 shadow-card">
            <h3 className="text-[22px] font-semibold tracking-tight">Istraži mapu</h3>
            <p className="mt-1.5 max-w-[22ch] text-muted">{results.length} aktivnosti širom Bosne i Hercegovine.</p>
            <a
              href="#mapa"
              className="relative z-10 mt-[18px] inline-flex items-center gap-2.5 rounded-full bg-surface px-5 py-2.5 text-sm font-medium shadow-soft"
            >
              Otvori mapu
              <LongArrow />
            </a>
            <div className="absolute right-2 -bottom-1.5 w-[min(62%,330px)] opacity-45 sm:opacity-100">
              <MapTeaser
                dots={results.map((a) => a.coordinates)}
                from={start ? { label: start.name, coordinates: start.coordinates } : undefined}
                to={{ label: featured.title, coordinates: featured.coordinates }}
              />
            </div>
          </div>
        </div>
      </section>

      <section id="mapa" aria-labelledby="mapa-naslov" className={`${card} scroll-mt-6 px-4 pt-[26px] pb-6 sm:px-8`}>
        <div className="flex flex-wrap items-end justify-between gap-2 px-2">
          <h2 id="mapa-naslov" className="font-serif text-[clamp(26px,3vw,34px)] leading-tight">
            Mapa aktivnosti
          </h2>
          <p className="text-[13px] text-muted">Klikni grad za aktivnosti u blizini, ili tačku za karticu.</p>
        </div>
        <div className="mx-auto mt-4 max-w-[60rem]">
          <BosniaMap
            activities={activities}
            highlightedIds={results.map((a) => a.id)}
            activeId={activeId}
            onSelect={showCard}
            onHover={setActiveId}
            selectedCity={cityName}
            onSelectCity={selectCity}
          />
        </div>
      </section>
    </div>
  );
}
