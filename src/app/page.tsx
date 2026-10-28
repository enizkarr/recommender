import { Suspense } from "react";
import Recommender from "@/components/Recommender";
import WeatherWidget from "@/components/WeatherWidget";
import { prefsFromQuery } from "@/lib/filtersUrl";

// Not async: the URL is only read inside the Suspense boundary below,
// so the header and the unfiltered view stay part of the prerendered page.
export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main className="relative flex-1 px-6 pt-20 pb-12">
      {/* Top-left corner on large screens; above the title on smaller ones so it never covers it. */}
      <WeatherWidget className="mx-auto mb-8 lg:absolute lg:top-6 lg:left-6 lg:z-10 lg:m-0" />
      <header className="mx-auto mb-12 w-[60%] min-w-[16rem] text-center">
        <h1 className="bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 bg-clip-text px-4 py-6 font-display text-[clamp(3.5rem,12vw,11rem)] leading-[1.3] font-normal tracking-normal text-transparent drop-shadow-sm">
          Family Time
        </h1>
        <div className="mx-auto mt-4 h-1 w-full rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600" />
        {/* Frosted pill so the sentence stays readable over the background photo */}
        <p className="mt-6 inline-block rounded-3xl bg-white/75 px-6 py-2 text-xl font-semibold tracking-tight text-balance text-zinc-800 shadow-lg backdrop-blur-md md:text-2xl dark:bg-zinc-900/75 dark:text-zinc-100">
          Otkrij zadivljujuća odredišta, stvori nezaboravne uspomene i doživi{" "}
          <span className="bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 bg-clip-text text-transparent">
            ljepotu naše zemlje
          </span>{" "}
          – putovanje po putovanje.
        </p>
      </header>
      <div className="mx-auto w-full max-w-[150rem]">
        <Suspense fallback={<Recommender initialPrefs={null} />}>
          {/* A shared link like ?mjesto=priroda opens with those filters already applied. */}
          {searchParams.then((query) => (
            <Recommender initialPrefs={prefsFromQuery(query)} />
          ))}
        </Suspense>
      </div>
    </main>
  );
}
