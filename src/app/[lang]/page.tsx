import { Suspense } from "react";
import Rail from "@/components/Rail";
import Recommender from "@/components/Recommender";
import { activities } from "@/data/activities";
import { isLang } from "@/i18n/dictionaries";
import { activityFromQuery, prefsFromQuery, sharedFromQuery } from "@/lib/filtersUrl";

// The query is only read inside the Suspense boundary below, so the shell and the unfiltered
// view stay part of the prerendered page.
export default async function Home({ params, searchParams }: PageProps<"/[lang]">) {
  // Known at build time (both languages are prerendered), so awaiting it here keeps the shell static.
  const { lang } = await params;
  return (
    <div
      id="top"
      className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[92px_minmax(0,1fr)] lg:gap-7"
    >
      <Rail lang={isLang(lang) ? lang : "bs"} active="home" />
      <main className="min-w-0">
        <Suspense fallback={<Recommender initialPrefs={null} />}>
          {/* A shared link like ?mjesto=priroda opens with those filters already applied,
              ?aktivnost=kravice with that activity's details open, and ?favoriti=kravice,jajce
              with that shared list of favourites. */}
          {searchParams.then((query) => {
            const id = activityFromQuery(query);
            const sharedIds = sharedFromQuery(query).filter((shared) => activities.some((a) => a.id === shared));
            return (
              <Recommender
                initialPrefs={prefsFromQuery(query)}
                initialActivityId={activities.some((a) => a.id === id) ? id : null}
                initialSharedIds={sharedIds.length > 0 ? sharedIds : null}
              />
            );
          })}
        </Suspense>
      </main>
    </div>
  );
}
