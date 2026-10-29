"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import ActivityDetail from "@/components/ActivityDetail";
import BosniaMap from "@/components/BosniaMap";
import DirectionsLink from "@/components/DirectionsLink";
import FilterModal, { SlidersIcon } from "@/components/FilterModal";
import MapTeaser from "@/components/MapTeaser";
import Photo from "@/components/Photo";
import StartHint, { markStartHintSeen, useFirstVisit } from "@/components/StartHint";
import StartLocationPicker from "@/components/StartLocationPicker";
import WeatherWidget, { isRainy } from "@/components/WeatherWidget";
import WeekendPlanner from "@/components/WeekendPlanner";
import { activities } from "@/data/activities";
import { cities } from "@/data/cities";
import { ACTIVITY_PARAM, noFilters, pageQuery } from "@/lib/filtersUrl";
import { HERO_SIZE, heroPicks, useWeekKey } from "@/lib/heroPicks";
import { distanceKm, isNear, NEAR_CITY_KM, recommend } from "@/lib/recommend";
import { directionsUrl, formatDrive, tripKm, useDrives, type Trip } from "@/lib/driving";
import { costLabel, placeLabel } from "@/lib/labels";
import { useStartLocation } from "@/lib/startLocation";
import type { Activity, Preferences } from "@/lib/types";

/** How long the hero waits for the weather before picking as on a dry day. */
const WEATHER_WAIT_MS = 2500;
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

/** Address for the page with these filters and, when one is open, an activity's details. */
function pageUrl(prefs: Preferences, activityId: string | null): string {
  const query = pageQuery(prefs, activityId);
  return query ? `?${query}` : window.location.pathname;
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

/** Navigation arrow, as used by map apps for "directions". */
function NavIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" aria-hidden>
      <path d="M3 11 21 3l-8 18-2-8z" />
    </svg>
  );
}

const roundButton = "grid size-[38px] shrink-0 place-items-center rounded-full bg-page text-ink shadow-soft transition hover:-translate-y-0.5";
const card = "rounded-[30px] bg-surface shadow-card";

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
  trip?: Trip;
  /** Starting point for the directions link; without it Google Maps starts from the device's location. */
  from?: [number, number];
  onHover: (id: string | null) => void;
  onFeature: (id: string) => void;
  /** Opens the activity's details. */
  onOpen: (id: string) => void;
}

function PlaceCard({ a, active, trip, from, onHover, onFeature, onOpen }: PlaceCardProps) {
  return (
    <article
      id={`card-${a.id}`}
      onMouseEnter={() => onHover(a.id)}
      onMouseLeave={() => onHover(null)}
      className={`relative flex flex-col rounded-3xl border bg-surface px-2 pt-2 pb-4 shadow-soft transition hover:-translate-y-0.5 ${active ? "border-accent ring-2 ring-accent" : "border-line"}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[18px]">
        <Photo a={a} sizes="(min-width: 1080px) 18rem, (min-width: 640px) 45vw, 90vw" />
      </div>
      <div className="flex items-center justify-between gap-2 px-2 pt-3.5">
        <div className="min-w-0">
          <h3 className="font-medium">
            {/* Stretched over the whole card, so a click anywhere opens the details; the buttons sit above it */}
            <button type="button" onClick={() => onOpen(a.id)} className="text-left after:absolute after:inset-0 after:rounded-3xl after:content-['']">
              {a.title}
            </button>
          </h3>
          <p className="text-[13px] text-muted">{a.location}</p>
        </div>
        <button type="button" onClick={() => onFeature(a.id)} aria-label={`Istakni: ${a.title}`} className={`relative z-10 ${roundButton}`}>
          <Arrow />
        </button>
      </div>
      <p className="line-clamp-2 px-2 pt-2 text-[13px] text-muted">{a.description}</p>
      <div className="mt-auto flex flex-wrap gap-1.5 px-2 pt-2.5 text-xs">
        {trip && <Tag tone="km">{tripKm(trip)}</Tag>}
        {trip?.minutes !== undefined && <Tag tone="km">🚗 {formatDrive(trip.minutes)}</Tag>}
        <Tag>{placeLabel[a.place]}</Tag>
        <Tag tone={a.cost === "free" ? "free" : "plain"}>{costLabel[a.cost]}</Tag>
        {a.coffee && <Tag>☕ Kafa</Tag>}
      </div>
      <DirectionsLink
        href={directionsUrl(a.coordinates, from)}
        label={`Kako doći: ${a.title} (otvara Google Maps)`}
        className="relative z-10 mx-2 mt-3 flex items-center justify-center gap-2 rounded-full bg-accent/12 py-2 text-[13px] font-medium text-accent transition hover:bg-accent/20"
      >
        <NavIcon />
        Kako doći
      </DirectionsLink>
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

/**
 * Tile with a coloured pictogram for a feature that is not built yet. It is deliberately not a
 * button and carries an "Uskoro" badge, so nobody clicks it expecting something to happen.
 */
function ComingSoonTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <li className="relative grid content-start justify-items-center gap-2 rounded-[26px] bg-surface px-1.5 pt-[22px] pb-3.5 text-center text-[13px] leading-tight shadow-card">
      <span className="absolute top-2 right-2 rounded-full bg-sun/90 px-2 py-0.5 text-[10px] font-semibold text-[#14305a]">Uskoro</span>
      <svg viewBox="0 0 40 40" className="size-9" aria-hidden>
        {children}
      </svg>
      {label}
    </li>
  );
}

export default function Recommender({
  initialPrefs,
  initialActivityId = null,
}: {
  initialPrefs: Preferences | null;
  /** Activity whose details a shared link (?aktivnost=…) opens. */
  initialActivityId?: string | null;
}) {
  // Filters apply straight away; they are also kept in the address bar so the page can be shared.
  const [prefs, setPrefsState] = useState<Preferences>(initialPrefs ?? noFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState("");
  // City picked on the map: only activities around it are shown, on top of the other filters.
  const [cityName, setCityName] = useState<string | null>(null);
  const city = cities.find((c) => c.name === cityName);
  const start = useStartLocation();
  // First-time visitors get a hint pointing at the starting point, until they pick one or close it.
  const firstVisit = useFirstVisit();
  const [hintClosed, setHintClosed] = useState(false);
  const startCard = useRef<HTMLDivElement>(null);
  const showStartHint = firstVisit && !hintClosed && !start;
  useEffect(() => {
    if (firstVisit && start) markStartHintSeen();
  }, [firstVisit, start]);
  const { drives, failed: routingFailed } = useDrives(start?.coordinates, activities);
  // Road kilometres once the router has answered. Until then (or if it cannot be reached) the
  // straight-line distance stands in, so sorting and the kilometre limit still work.
  const kmFromStart = (a: Activity) => (start ? (drives?.[a.id]?.km ?? distanceKm(start.coordinates, a.coordinates)) : undefined);
  /** What the cards show; nothing while the road distances are still loading. */
  const tripFor = (a: Activity): Trip | undefined => {
    if (!start) return undefined;
    const drive = drives?.[a.id];
    if (drive) return drive;
    if (drives || routingFailed) return { km: distanceKm(start.coordinates, a.coordinates), straight: true };
    return undefined;
  };

  const folded = fold(query.trim());
  const matching = (p: Preferences) => {
    const list = recommend(activities, p, kmFromStart).filter(
      (a) => (!city || isNear(a, city.coordinates)) && (!folded || fold(`${a.title} ${a.location} ${a.tags.join(" ")}`).includes(folded)),
    );
    // With a starting point, the closest activities come first.
    return start ? list.sort((x, y) => kmFromStart(x)! - kmFromStart(y)!) : list;
  };
  const results = matching(prefs);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? results : results.slice(0, FIRST_CARDS);

  // The hero offers this week's picks, or indoor ones when it rains. It waits for the week (known
  // only in the browser) and briefly for the weather, so it does not swap picks right after loading.
  const week = useWeekKey();
  const [rainy, setRainy] = useState<boolean | null>(null);
  useEffect(() => {
    const giveUp = setTimeout(() => setRainy((r) => r ?? false), WEATHER_WAIT_MS);
    return () => clearTimeout(giveUp);
  }, []);
  const picks = week && rainy !== null ? heroPicks(activities, week, rainy) : null;

  // The activity in the big card at the top (the first pick until one is chosen), and why it is there.
  const [featuredId, setFeaturedId] = useState<string | null>(null);
  const [suggested, setSuggested] = useState(false);
  const featured = activities.find((a) => a.id === (featuredId ?? picks?.[0]));
  const thumbs = !picks || !featured ? [] : picks.includes(featured.id) ? picks : [featured.id, ...picks.slice(0, HERO_SIZE - 1)];
  // While true, "Predloži" is flicking through the results before it settles on one.
  const [shuffling, setShuffling] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // The activity highlighted on both the map and the cards (hovered, or picked on the map).
  const [activeId, setActiveId] = useState<string | null>(null);

  const nearest = start && results[0];

  function setPrefs(next: Preferences) {
    setPrefsState(next);
    window.history.replaceState(null, "", pageUrl(next, openId));
  }

  // The activity whose details are open. Opening adds a history entry (?aktivnost=…), so the
  // browser's or phone's back button closes the popup and a copied link opens it again.
  const [openId, setOpenId] = useState<string | null>(initialActivityId);
  const pushedEntry = useRef(false);
  const openActivity = activities.find((a) => a.id === openId);

  useEffect(() => {
    const onBack = () => {
      const id = new URLSearchParams(window.location.search).get(ACTIVITY_PARAM);
      pushedEntry.current = false;
      setOpenId(activities.some((a) => a.id === id) ? id : null);
    };
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, []);

  function openDetail(id: string) {
    // Switching to another activity inside the popup replaces the entry instead of adding one.
    if (openId) {
      window.history.replaceState(null, "", pageUrl(prefs, id));
    } else {
      window.history.pushState(null, "", pageUrl(prefs, id));
      pushedEntry.current = true;
    }
    setOpenId(id);
  }

  function closeDetail() {
    if (pushedEntry.current) {
      // Going back removes the entry we added; the popstate listener then closes the popup.
      window.history.back();
      return;
    }
    // Opened straight from a shared link: there is no entry of ours to go back to.
    window.history.replaceState(null, "", pageUrl(prefs, null));
    setOpenId(null);
  }

  /** Up to three other activities near the one whose details are open, nearest first. */
  const nearby = openActivity
    ? activities
        .filter((a) => a.id !== openActivity.id && isNear(a, openActivity.coordinates))
        .sort((x, y) => distanceKm(x.coordinates, openActivity.coordinates) - distanceKm(y.coordinates, openActivity.coordinates))
        .slice(0, 3)
    : [];

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
    const pool = results.length > 1 ? results.filter((a) => a.id !== featured?.id) : results;
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
  const featuredTrip = featured && tripFor(featured);
  const nearestTrip = nearest ? tripFor(nearest) : undefined;
  const eyebrow = shuffling
    ? "Biramo…"
    : suggested
      ? "Naš prijedlog"
      : featured && picks?.includes(featured.id)
        ? rainy
          ? "Za kišni dan"
          : "Izlet sedmice"
        : "Izdvojeno";

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
          <h1 className="text-[clamp(28px,3.4vw,40px)] leading-tight font-semibold tracking-tight">Gdje ćemo danas?👋</h1>
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
      </header>

      <section className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_270px]">
        {/* Featured activity: a photo inside a white rim, both cut to the same organic shape */}
        <div id="istaknuto" className="drop-shadow-[0_14px_24px_rgba(40,52,80,.16)]">
          <div className="blob bg-rim p-3">
            <article className="blob relative flex min-h-[470px] flex-col bg-[#3a6ea8] text-white sm:min-h-[520px]" aria-live="polite">
              {!featured ? (
                // Same shape while the week's picks are being chosen
                <div className="max-w-[460px] animate-pulse space-y-4 px-[30px] pt-[46px] sm:px-14 sm:pt-[70px]" aria-hidden>
                  <div className="h-3 w-28 rounded bg-white/30" />
                  <div className="h-14 w-72 max-w-full rounded-lg bg-white/25" />
                  <div className="h-6 w-48 rounded bg-white/20" />
                  <div className="h-16 w-80 max-w-full rounded bg-white/15" />
                </div>
              ) : (
                <>
                  <Photo key={featured.id} a={featured} eager sizes="(min-width: 1024px) 50rem, 100vw" className={shuffling ? "" : "hero-photo"} />
                  <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(14,34,66,.75)_0%,rgba(14,34,66,.38)_45%,rgba(14,34,66,0)_72%)]" />
                  <div className={`relative max-w-[460px] px-[30px] pt-[46px] transition sm:px-14 sm:pt-[70px] ${shuffling ? "blur-[2px]" : ""}`}>
                    <p className="text-xs font-medium tracking-[0.22em] uppercase opacity-90">{eyebrow}</p>
                    <h2 className="mt-3.5 font-serif text-[clamp(40px,5.2vw,64px)] leading-none">{featured.title}</h2>
                    <p className="mt-1.5 font-serif text-[22px] sm:text-[26px]">{featured.location}</p>
                    <p className="mt-4 line-clamp-3 max-w-[34ch] opacity-95">{featured.description}</p>
                    <p className="mt-3 text-sm opacity-90">
                      {featuredTrip && `${tripKm(featuredTrip)} od vas · `}
                      {featuredTrip?.minutes !== undefined && `🚗 ${formatDrive(featuredTrip.minutes)} · `}
                      {featured.indoor ? "Unutra" : "Vani"} · {costLabel[featured.cost]}
                      {featured.coffee && " · ☕ Kafa"}
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openDetail(featured.id)}
                        className="inline-flex items-center gap-3 rounded-full border-2 border-white/85 bg-[rgba(20,48,90,.55)] px-[26px] py-3 font-medium backdrop-blur-sm transition hover:bg-[rgba(20,48,90,.75)]"
                      >
                        Detalji
                        <LongArrow />
                      </button>
                      <DirectionsLink
                        href={directionsUrl(featured.coordinates, start?.coordinates)}
                        label={`Kako doći: ${featured.title} (otvara Google Maps)`}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-medium text-[#14305a] transition hover:bg-white/90"
                      >
                        <NavIcon />
                        Kako doći
                      </DirectionsLink>
                    </div>
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
                          <Photo a={a} sizes="72px" eager />
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </article>
          </div>
        </div>

        <aside className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-1">
          <p
            className="flex items-center justify-center gap-1.5 pt-1.5 pl-3 font-script text-[54px] leading-[.9] text-accent sm:col-span-2 lg:col-span-1 lg:-rotate-[8deg] lg:justify-start"
            aria-hidden
          >
            Hajmo vani!
            <svg width="40" height="40" viewBox="0 0 40 40" className="shrink-0">
              <circle cx={20} cy={20} r={7} className="fill-sun" />
              <g className="stroke-sun" strokeWidth={2.5} strokeLinecap="round">
                <path d="M20 4v5M20 31v5M4 20h5M31 20h5M8.7 8.7l3.5 3.5M27.8 27.8l3.5 3.5M8.7 31.3l3.5-3.5M27.8 12.2l3.5-3.5" />
              </g>
            </svg>
          </p>
          <WeatherWidget onWeather={(code) => setRainy(code !== null && isRainy(code))} />
          <div ref={startCard} className={`${card} p-5`}>
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
                  {nearestTrip ? `${tripKm(nearestTrip)} od vas` : "Računam udaljenost…"}
                  {nearestTrip?.minutes !== undefined && ` · 🚗 ${formatDrive(nearestTrip.minutes)}`}
                </p>
                <button type="button" onClick={() => feature(nearest.id)} aria-label={`Istakni: ${nearest.title}`} className={roundButton}>
                  <Arrow />
                </button>
              </div>
            )}
          </div>
        </aside>
      </section>

      {showStartHint && (
        <StartHint
          target={startCard}
          onClose={() => {
            markStartHintSeen();
            setHintClosed(true);
          }}
        />
      )}

      <WeekendPlanner start={start} results={results} tripFor={tripFor} onOpen={openDetail} />

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
            <PlaceCard key={a.id} a={a} active={a.id === activeId} trip={tripFor(a)} from={start?.coordinates} onHover={setActiveId} onOpen={openDetail} onFeature={feature} />
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

      {openActivity && (
        <ActivityDetail
          activity={openActivity}
          trip={tripFor(openActivity)}
          start={start}
          nearby={nearby}
          onSelect={openDetail}
          onClose={closeDetail}
        />
      )}

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
              <Photo a={(suggested && featured) || activities.find((a) => a.id === "stari-most")!} sizes="76px" />
            </div>
            <p className="min-w-0 flex-1">
              <strong className="block font-medium">Ne znate kuda?</strong>
              <span className="text-[13px] text-muted">
                {suggested && !shuffling && featured ? `Kako bi bilo: ${featured.title}?` : "Pustite nas da predložimo izlet."}
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
          <ul className="m-0 grid list-none grid-cols-2 gap-3.5 p-0 sm:grid-cols-4" aria-label="Uskoro na Family Time">
            <ComingSoonTile label="Top destinacije">
              {/* A star above a winners' podium */}
              <rect x={6} y={26} width={9} height={10} rx={1.5} fill="#c99a5b" />
              <rect x={15.5} y={20} width={9} height={16} rx={1.5} className="fill-accent" />
              <rect x={25} y={29} width={9} height={7} rx={1.5} fill="#c99a5b" />
              <path d="M20 4 21.76 8.57 26.66 8.84 22.85 11.93 24.11 16.66 20 14 15.89 16.66 17.15 11.93 13.34 8.84 18.24 8.57Z" className="fill-sun" stroke="#14305a" strokeWidth={1} strokeLinejoin="round" />
            </ComingSoonTile>
            <ComingSoonTile label="Predloži destinaciju">
              {/* A map pin with a plus: add a new place */}
              <path d="M20 3a11 11 0 0 0-11 11c0 8 11 22 11 22s11-14 11-22A11 11 0 0 0 20 3z" className="fill-accent" />
              <path d="M20 9v10M15 14h10" stroke="white" strokeWidth={3} strokeLinecap="round" />
            </ComingSoonTile>
            <ComingSoonTile label="Poredi destinacije">
              {/* Two places side by side, with arrows going both ways */}
              <rect x={3} y={4} width={13} height={20} rx={3} fill="#c99a5b" />
              <rect x={24} y={4} width={13} height={20} rx={3} className="fill-accent" />
              <path d="M6 18h7M6 21h5M27 18h7M27 21h5" stroke="white" strokeWidth={1.6} strokeLinecap="round" />
              <path d="M10 30h20m-4-3 4 3-4 3M30 36H10m4-3-4 3 4 3" fill="none" stroke="#14305a" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-[#e7edf7]" />
            </ComingSoonTile>
            <ComingSoonTile label="Moji favoriti">
              <path d="M20 34S5 25 5 15a8 8 0 0 1 15-4 8 8 0 0 1 15 4c0 10-15 19-15 19z" fill="#e25b5b" />
              <path d="M12.5 13.5a4 4 0 0 1 4-3" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" opacity={0.7} />
            </ComingSoonTile>
          </ul>

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
                to={featured && { label: featured.title, coordinates: featured.coordinates }}
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
