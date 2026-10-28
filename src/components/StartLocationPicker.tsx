"use client";

import { useState } from "react";
import { nearestTown, saveStartLocation, towns, type StartLocation } from "@/lib/startLocation";

const geoErrors: Record<number, string> = {
  1: "Pristup lokaciji je odbijen. Odaberi grad iz liste.",
  2: "Lokacija trenutno nije dostupna. Odaberi grad iz liste.",
  3: "Traženje lokacije je trajalo predugo. Pokušaj ponovo ili odaberi grad.",
};

function PinIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 21s-6.5-5.8-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.2 12 21 12 21Z" />
      <circle cx={12} cy={10} r={2.3} />
    </svg>
  );
}

/** Sets where the family starts from: the browser's location on request, or a town from the list. */
export default function StartLocationPicker({ location }: { location: StartLocation | null }) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function locate() {
    if (!("geolocation" in navigator)) {
      setError("Ovaj preglednik ne podržava lokaciju. Odaberi grad iz liste.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        // Rounded to about a kilometre: enough for distances, and nothing more precise is stored.
        const coordinates: [number, number] = [+coords.latitude.toFixed(2), +coords.longitude.toFixed(2)];
        const town = nearestTown(coordinates);
        if (!town) {
          setError("Izgleda da nisi u Bosni i Hercegovini. Odaberi grad iz kojeg krećete.");
          return;
        }
        saveStartLocation({ name: town.name, coordinates, source: "gps" });
      },
      (e) => {
        setLocating(false);
        setError(geoErrors[e.code] ?? geoErrors[2]);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 },
    );
  }

  function pickTown(name: string) {
    const town = towns.find((t) => t.name === name);
    if (!town) return;
    setError(null);
    saveStartLocation({ name: town.name, coordinates: town.coordinates, source: "city" });
  }

  if (location) {
    return (
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sun text-[#14305a]">
          <PinIcon />
        </span>
        <p className="min-w-0 flex-1">
          <strong className="block truncate font-medium">{location.name}</strong>
          <span className="text-[13px] text-muted">{location.source === "gps" ? "Tvoja lokacija (u blizini)" : "Odabrani grad"}</span>
        </p>
        <button
          type="button"
          onClick={() => saveStartLocation(null)}
          className="shrink-0 text-[13px] font-medium text-accent hover:underline"
        >
          Promijeni
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <button
        type="button"
        onClick={locate}
        disabled={locating}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-surface shadow-soft transition active:scale-[0.98] disabled:opacity-70"
      >
        <PinIcon />
        {locating ? "Tražim lokaciju…" : "Koristi moju lokaciju"}
      </button>
      <label className="sr-only" htmlFor="start-town">
        Odaberi grad iz kojeg krećete
      </label>
      <select
        id="start-town"
        value=""
        onChange={(e) => pickTown(e.target.value)}
        className="w-full rounded-full border-0 bg-page px-4 py-2.5 text-sm font-medium text-ink shadow-[inset_0_1px_0_var(--rim),0_1px_3px_rgba(40,52,80,.08)]"
      >
        <option value="" disabled>
          ili odaberi grad
        </option>
        {towns.map((t) => (
          <option key={t.name} value={t.name}>
            {t.name}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="text-[13px] text-rose-700 dark:text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}
