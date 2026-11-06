import { Suspense } from "react";
import PageShell from "@/components/PageShell";
import Recommender from "@/components/Recommender";
import { activities } from "@/data/activities";
import { langOf } from "@/i18n/dictionaries";
import { activityFromQuery, prefsFromQuery, sharedFromQuery } from "@/lib/filtersUrl";

// The query is only read inside the Suspense boundary below, so the shell and the unfiltered
// view stay part of the prerendered page.
export default async function Home({ params, searchParams }: PageProps<"/[lang]">) {
  // Known at build time (both languages are prerendered), so awaiting it here keeps the shell static.
  const { lang } = await params;
  return (
    <PageShell lang={langOf(lang)} active="home">
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
    </PageShell>
  );
}
