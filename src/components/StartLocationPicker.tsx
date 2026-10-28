"use client";

import { useState } from "react";
import { nearestTown, saveStartLocation, towns, type StartLocation } from "@/lib/startLocation";

const pill =
  "rounded-full border border-white/60 bg-white/85 shadow-lg backdrop-blur-md dark:border-zinc-700/60 dark:bg-zinc-900/85";

const geoErrors: Record<number, string> = {
  1: "Pristup lokaciji je odbijen. Odaberi grad iz liste.",
  2: "Lokacija trenutno nije dostupna. Odaberi grad iz liste.",
  3: "Traženje lokacije je trajalo predugo. Pokušaj ponovo ili odaberi grad.",
};

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
      <div className={`mx-auto flex w-fit items-center gap-3 py-1.5 pr-1.5 pl-4 text-sm ${pill}`}>
        <span className="text-zinc-700 dark:text-zinc-200">
          🏠 Polazište: <strong className="font-semibold">{location.name}</strong>
          {location.source === "gps" && <span className="text-zinc-500 dark:text-zinc-400"> (u blizini)</span>}
        </span>
        <button
          type="button"
          onClick={() => saveStartLocation(null)}
          className="rounded-full border border-zinc-200 bg-white px-3 py-1 font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        >
          Promijeni
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`flex flex-wrap items-center justify-center gap-2 p-1.5 text-sm ${pill}`}>
        <button
          type="button"
          onClick={locate}
          disabled={locating}
          className="rounded-full bg-rose-600 px-4 py-2 font-medium text-white transition hover:bg-rose-700 active:scale-95 disabled:opacity-70"
        >
          {locating ? "Tražim lokaciju…" : "📍 Koristi moju lokaciju"}
        </button>
        <span className="text-zinc-500 dark:text-zinc-400">ili</span>
        <label className="sr-only" htmlFor="start-town">
          Odaberi grad iz kojeg krećete
        </label>
        <select
          id="start-town"
          value=""
          onChange={(e) => pickTown(e.target.value)}
          className="rounded-full border border-zinc-200 bg-white py-2 pr-8 pl-4 font-medium text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <option value="" disabled>
            Odaberi grad
          </option>
          {towns.map((t) => (
            <option key={t.name} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p role="alert" className="rounded-full bg-white/85 px-4 py-1 text-sm text-rose-700 shadow backdrop-blur dark:bg-zinc-900/85 dark:text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}
