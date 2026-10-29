import { useEffect, useState } from "react";
import type { Activity } from "./types";

/** The drive from the starting point to one activity, by road. */
export interface Drive {
  minutes: number;
  km: number;
}

/** Drives per activity id; activities the router cannot reach by road are left out. */
export type Drives = Record<string, Drive>;

// OSRM's public demo server (OpenStreetMap roads). One "table" request returns the time and road
// distance from the starting point to every activity. Kept per starting point, so switching back
// costs nothing.
const OSRM_TABLE = "https://router.project-osrm.org/table/v1/driving/";
const cache = new Map<string, Promise<Drives>>();

function fetchDrives(from: [number, number], activities: Activity[]): Promise<Drives> {
  const key = from.join(",");
  let request = cache.get(key);
  if (!request) {
    // OSRM wants longitude,latitude pairs; the starting point goes first and is the only source.
    const points = [from, ...activities.map((a) => a.coordinates)].map(([lat, lon]) => `${lon},${lat}`).join(";");
    request = fetch(`${OSRM_TABLE}${points}?sources=0&annotations=duration,distance`)
      .then((res) => {
        if (!res.ok) throw new Error(`OSRM: ${res.status}`);
        return res.json() as Promise<{ code: string; durations: (number | null)[][]; distances: (number | null)[][] }>;
      })
      .then((data) => {
        if (data.code !== "Ok") throw new Error(`OSRM: ${data.code}`);
        const drives: Drives = {};
        activities.forEach((a, i) => {
          const seconds = data.durations[0][i + 1];
          const metres = data.distances[0][i + 1];
          if (seconds !== null && metres !== null) drives[a.id] = { minutes: seconds / 60, km: metres / 1000 };
        });
        return drives;
      });
    // A failed request is not kept, so the next visit to this starting point tries again.
    request.catch(() => cache.delete(key));
    cache.set(key, request);
  }
  return request;
}

/**
 * Road distance and driving time from the starting point to each activity. `drives` is null while
 * loading and without a starting point; `failed` says the router could not be reached.
 */
export function useDrives(from: [number, number] | undefined, activities: Activity[]): { drives: Drives | null; failed: boolean } {
  const key = from ? from.join(",") : null;
  const [loaded, setLoaded] = useState<{ key: string; drives: Drives | null } | null>(null);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const [lat, lon] = key.split(",").map(Number);
    fetchDrives([lat, lon], activities)
      .then((drives) => !cancelled && setLoaded({ key, drives }))
      .catch(() => !cancelled && setLoaded({ key, drives: null }));
    return () => {
      cancelled = true;
    };
  }, [key, activities]);

  const current = loaded && loaded.key === key ? loaded : null;
  return { drives: current?.drives ?? null, failed: !!current && !current.drives };
}

/** "15 min", "1 h 10 min", "2 h": rounded to 5 minutes, since road times are estimates anyway. */
export function formatDrive(minutes: number): string {
  if (minutes < 5) return "do 5 min";
  const rounded = Math.round(minutes / 5) * 5;
  if (rounded < 60) return `${rounded} min`;
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
