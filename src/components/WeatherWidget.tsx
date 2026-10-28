"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import { cities } from "@/data/cities";
import { useStartLocation } from "@/lib/startLocation";

// Spread across the country; without a starting point their combined weather is shown, as a picture of the whole of BiH.
const WEATHER_CITIES = ["Sarajevo", "Banja Luka", "Mostar", "Tuzla", "Bihać"];
const REFRESH_MS = 15 * 60 * 1000;

interface CityWeather {
  name: string;
  temperature: number;
  code: number;
  isDay: boolean;
}

/** What the card shows: one place's weather, or the whole country summed up. */
interface Weather {
  place: string;
  temperature: number;
  code: number;
  isDay: boolean;
  min: number;
  max: number;
  /** Small grey note after min/max, saying what the numbers cover. */
  note: string;
}

type Sky = "clear" | "partly" | "overcast" | "fog" | "rain" | "snow" | "storm";

/** WMO weather code (as used by Open-Meteo) to a Bosnian label and a sky type. */
function describe(code: number): { label: string; sky: Sky } {
  if (code === 0) return { label: "Vedro", sky: "clear" };
  if (code === 1) return { label: "Pretežno vedro", sky: "clear" };
  if (code === 2) return { label: "Djelimično oblačno", sky: "partly" };
  if (code === 3) return { label: "Oblačno", sky: "overcast" };
  if (code === 45 || code === 48) return { label: "Magla", sky: "fog" };
  if (code >= 51 && code <= 57) return { label: "Rosulja", sky: "rain" };
  if (code >= 61 && code <= 67) return { label: "Kiša", sky: "rain" };
  if (code >= 71 && code <= 77) return { label: "Snijeg", sky: "snow" };
  if (code >= 80 && code <= 82) return { label: "Pljuskovi", sky: "rain" };
  if (code === 85 || code === 86) return { label: "Snježni pljuskovi", sky: "snow" };
  if (code >= 95) return { label: "Grmljavina", sky: "storm" };
  return { label: "Promjenljivo", sky: "partly" };
}

// Background photo for each sky type, with the credit their licences ask for.
const backgrounds: Record<Sky, { src: string; credit: string; source: string }> = {
  clear: {
    src: "/activities/kravice.jpg",
    credit: "Niegodzisie, CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Kravica_111549.jpg",
  },
  partly: {
    src: "/weather/partly-cloudy.jpg",
    credit: "Maoileann, CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Mountains-9795,_Dingle_Peninsula,_Co._Kerry,_Ireland.jpg",
  },
  overcast: {
    src: "/weather/overcast.jpg",
    credit: "Talha J Siam, CC BY 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Misty_Green_Mountains.jpg",
  },
  fog: {
    src: "/weather/fog.jpg",
    credit: "Christopher Michel, CC BY 2.0",
    source: "https://commons.wikimedia.org/wiki/File:Morning_fog_over_Danum_Valley_(27329938517).jpg",
  },
  rain: {
    src: "/weather/rain.jpg",
    credit: "Michal Klajban, CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Rain_over_Beinn_Eich,_Luss_Hills,_Scotland.jpg",
  },
  snow: {
    src: "/weather/snow.jpg",
    credit: "Pudelek, CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Beskid_S%C4%85decki_in_winter_2016_05.jpg",
  },
  storm: {
    src: "/weather/storm.jpg",
    credit: "Murray Foubister, CC BY-SA 2.0",
    source: "https://commons.wikimedia.org/wiki/File:Summer_lightning_storm_over_the_City_of_Kamloops,_BC._(19414081884).jpg",
  },
};

// Thin white line icons in the style of the weather design.
function Svg({ children, className = "size-5" }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

const cloud = <path d="M7 18h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 7 9.5 4.25 4.25 0 0 0 7 18Z" />;

function SkyIcon({ sky, isDay, className }: { sky: Sky; isDay: boolean; className?: string }) {
  if (sky === "clear")
    return isDay ? (
      <Svg className={className}>
        <circle cx={12} cy={12} r={4} />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
      </Svg>
    ) : (
      <Svg className={className}>
        <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
      </Svg>
    );
  if (sky === "partly")
    return (
      <Svg className={className}>
        <path d="M8.5 6.5a4 4 0 0 1 6.9 1.6M8.5 2.5v1.2M3.5 7.5h1.2M5 4l.8.8" />
        <path d="M8 20h9a3.5 3.5 0 0 0 .4-6.98A5 5 0 0 0 8 12.5a3.75 3.75 0 0 0 0 7.5Z" />
      </Svg>
    );
  if (sky === "fog")
    return (
      <Svg className={className}>
        <path d="M4 9h16M3 13h18M5 17h14M8 21h8" />
      </Svg>
    );
  if (sky === "rain")
    return (
      <Svg className={className}>
        <path d="M7 15h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 7 6.5 4.25 4.25 0 0 0 7 15Z" />
        <path d="M8 18l-1 2.5M12 18l-1 2.5M16 18l-1 2.5" />
      </Svg>
    );
  if (sky === "snow")
    return (
      <Svg className={className}>
        <path d="M7 15h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 7 6.5 4.25 4.25 0 0 0 7 15Z" />
        <path d="M8 19h.01M12 20.5h.01M16 19h.01M10 22h.01M14 22h.01" strokeWidth={2.4} />
      </Svg>
    );
  if (sky === "storm")
    return (
      <Svg className={className}>
        <path d="M7 15h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 7 6.5 4.25 4.25 0 0 0 7 15Z" />
        <path d="M12.5 15 10.5 18.5h3l-2 3.5" />
      </Svg>
    );
  return <Svg className={className}>{cloud}</Svg>;
}

async function fetchCountry(): Promise<Weather> {
  const picked = WEATHER_CITIES.map((name) => cities.find((c) => c.name === name)!);
  const params = new URLSearchParams({
    latitude: picked.map((c) => c.coordinates[0]).join(","),
    longitude: picked.map((c) => c.coordinates[1]).join(","),
    current: "temperature_2m,weather_code,is_day",
    timezone: "Europe/Sarajevo",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo: ${res.status}`);
  // With several locations the API answers with one entry per location, in the same order.
  const data: { current: { temperature_2m: number; weather_code: number; is_day: number } }[] = await res.json();
  const list: CityWeather[] = data.map((d, i) => ({
    name: picked[i].name,
    temperature: Math.round(d.current.temperature_2m),
    code: d.current.weather_code,
    isDay: d.current.is_day === 1,
  }));
  const overall = mostCommon(list);
  const temps = list.map((c) => c.temperature);
  return {
    place: "Bosna i Hercegovina",
    temperature: Math.round(temps.reduce((sum, t) => sum + t, 0) / temps.length),
    code: overall.code,
    isDay: overall.isDay,
    min: Math.min(...temps),
    max: Math.max(...temps),
    note: `prosjek ${list.length} ${list.length >= 5 ? "gradova" : "grada"}`,
  };
}

/** Current weather at the starting point, with today's lowest and highest temperature there. */
async function fetchPlace(place: string, [latitude, longitude]: [number, number]): Promise<Weather> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,weather_code,is_day",
    daily: "temperature_2m_min,temperature_2m_max",
    forecast_days: "1",
    timezone: "Europe/Sarajevo",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo: ${res.status}`);
  const data: {
    current: { temperature_2m: number; weather_code: number; is_day: number };
    daily: { temperature_2m_min: number[]; temperature_2m_max: number[] };
  } = await res.json();
  return {
    place,
    temperature: Math.round(data.current.temperature_2m),
    code: data.current.weather_code,
    isDay: data.current.is_day === 1,
    min: Math.round(data.daily.temperature_2m_min[0]),
    max: Math.round(data.daily.temperature_2m_max[0]),
    note: "danas",
  };
}

/** The condition shared by the most cities; ties go to the first city in the list. */
function mostCommon(list: CityWeather[]): CityWeather {
  const counts = new Map<string, number>();
  for (const c of list) counts.set(describe(c.code).label, (counts.get(describe(c.code).label) ?? 0) + 1);
  return list.reduce((best, c) => (counts.get(describe(c.code).label)! > counts.get(describe(best.code).label)! ? c : best));
}

/**
 * A card with the current weather at the family's starting point, or across Bosnia and Herzegovina
 * when none is set, on a photo that matches the sky.
 */
export default function WeatherWidget({ className = "" }: { className?: string }) {
  const start = useStartLocation();
  // Plain values, so the weather is only fetched again when the place really changes.
  const startName = start?.name;
  const startLat = start?.coordinates[0];
  const startLon = start?.coordinates[1];
  const [weather, setWeather] = useState<Weather | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      (startName && startLat !== undefined && startLon !== undefined ? fetchPlace(startName, [startLat, startLon]) : fetchCountry())
        .then((w) => {
          if (cancelled) return;
          setWeather(w);
          setUpdatedAt(new Date());
          setFailed(false);
        })
        .catch(() => !cancelled && setFailed(true));
    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [startName, startLat, startLon]);

  const summary = weather && describe(weather.code);
  const background = summary && backgrounds[summary.sky];
  const isNight = weather ? !weather.isDay : false;

  return (
    <aside
      aria-label={`Vrijeme: ${weather?.place ?? "Bosna i Hercegovina"}`}
      className={`relative w-80 overflow-hidden rounded-3xl text-white ${className}`}
    >
      {/* Background layer: slightly see-through, and fading out more towards the edges so the card
          blends into the page. The text sits above it at full strength. */}
      <div className="absolute inset-0 opacity-90 [mask-image:radial-gradient(ellipse_at_center,black_45%,rgba(0,0,0,0.35)_100%)]">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-600 to-slate-800" />
        {background && <Image src={background.src} alt="" fill sizes="20rem" className="object-cover" priority />}
        {/* Darkens the photo (more at night) so the white text stays readable */}
        <div
          className={`absolute inset-0 bg-gradient-to-b ${isNight ? "from-slate-950/80 via-slate-950/60 to-slate-950/80" : "from-black/40 via-black/10 to-black/45"}`}
        />
      </div>

      <div className="relative space-y-4 p-5">
        {failed && !weather && <p className="text-sm text-white/80">Vrijeme trenutno nije dostupno.</p>}

        {!failed && !weather && (
          // Placeholder with the same shape while the first request is on its way
          <div className="animate-pulse space-y-3" aria-hidden>
            <div className="h-8 w-40 rounded-lg bg-white/20" />
            <div className="h-28 rounded-2xl bg-white/15" />
          </div>
        )}

        {weather && summary && (
          <>
            <h2 className="text-3xl leading-tight font-semibold tracking-tight drop-shadow">{summary.label}</h2>

            {/* Mostly see-through with a light blur, so the photo shows behind the numbers */}
            <div className="rounded-2xl border border-white/25 bg-white/5 p-4 backdrop-blur-[2px] [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <Svg className="size-4">
                  <path d="M12 21s-6.5-5.8-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.2 12 21 12 21Z" />
                  <circle cx={12} cy={10} r={2.3} />
                </Svg>
                {weather.place}
              </p>
              <div className="mt-1 flex items-end justify-between">
                <p className="text-6xl leading-none font-light tracking-tight">
                  {weather.temperature}°<span className="text-5xl">C</span>
                </p>
                <SkyIcon sky={summary.sky} isDay={weather.isDay} className="mb-1 size-10" />
              </div>
              <p className="mt-3 flex gap-4 text-sm text-white/85">
                <span>Min {weather.min}°</span>
                <span>Maks {weather.max}°</span>
                <span className="text-white/60">{weather.note}</span>
              </p>
            </div>

            {/* Brighter, with a shadow: this line sits near the faded edge of the background */}
            <p className="text-[10px] leading-snug text-white/85 drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]">
              Podaci:{" "}
              <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="hover:underline">
                Open-Meteo
              </a>
              {updatedAt && ` · ${updatedAt.toLocaleTimeString("bs-BA", { hour: "2-digit", minute: "2-digit" })}`}
              {background && (
                <>
                  {" · Foto: "}
                  <a href={background.source} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {background.credit}
                  </a>
                </>
              )}
            </p>
          </>
        )}
      </div>
    </aside>
  );
}
