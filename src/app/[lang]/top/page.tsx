import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import ActivityPopups, { ActivityLink } from "@/components/ActivityPopups";
import PageShell, { PageHeader } from "@/components/PageShell";
import Photo from "@/components/Photo";
import { activitiesIn } from "@/i18n/activities";
import { dictionaries, langOf, topPath, type Dict, type Lang } from "@/i18n/dictionaries";
import { activityFromQuery } from "@/lib/filtersUrl";
import { averageRating, MIN_REVIEWS_FOR_RANK, rankActivities, type RankedActivity, type RatingTotal } from "@/lib/ranking";
import { ratingTotals } from "@/lib/reviews";

const MEDALS = ["🥇", "🥈", "🥉"];
const PODIUM_SIZE = MEDALS.length;

export async function generateMetadata({ params }: PageProps<"/[lang]/top">): Promise<Metadata> {
  const { lang } = await params;
  const t = dictionaries[langOf(lang)];
  return { title: `${t.top.title} – Family Time`, description: t.top.intro };
}

function Rating({ total, t }: { total?: RatingTotal; t: Dict }) {
  if (!total) return <span className="text-muted">{t.top.noRating}</span>;
  const average = t.reviews.average(averageRating(total));
  const count = t.reviews.count(total.count);
  return (
    <span>
      <span aria-hidden>
        <span className="text-sun">★</span> {average} <span className="text-muted">· {count}</span>
      </span>
      <span className="sr-only">{t.reviews.averageLabel(average, count)}</span>
    </span>
  );
}

/** One of the top places: large, with its photo. */
function PodiumCard({ entry: { activity: a, total }, rank, t }: { entry: RankedActivity; rank: number; t: Dict }) {
  return (
    <li className="min-w-0">
      <ActivityLink id={a.id} className="flex h-full flex-col rounded-3xl border border-line bg-surface px-2 pt-2 pb-4 shadow-soft transition hover:-translate-y-0.5">
        <span className="relative aspect-[4/3] overflow-hidden rounded-[18px]">
          <Photo a={a} sizes="(min-width: 640px) 22rem, 90vw" />
          <span className="absolute top-2 left-2 grid size-11 place-items-center rounded-full bg-white/90 text-2xl shadow-soft" role="img" aria-label={t.top.rank(rank)}>
            {MEDALS[rank - 1]}
          </span>
        </span>
        <span className="mt-3.5 block px-2 font-serif text-[22px] leading-tight">{a.title}</span>
        <span className="block px-2 pt-0.5 text-[13px] text-muted">{a.location}</span>
        <span className="mt-auto block px-2 pt-2.5 text-sm">
          <Rating total={total} t={t} />
        </span>
      </ActivityLink>
    </li>
  );
}

/** A place in the numbered list. Unranked places all show the same number, as they share that spot. */
function Row({ entry: { activity: a, total }, rank, t }: { entry: RankedActivity; rank: number; t: Dict }) {
  return (
    <li>
      <ActivityLink id={a.id} className="flex items-center gap-3 rounded-2xl bg-page p-2 pr-4 transition hover:bg-line/60 sm:gap-4">
        <span className="w-9 shrink-0 text-center font-serif text-[22px]" aria-label={t.top.rank(rank)}>
          {rank}
        </span>
        <span className="relative h-14 w-16 shrink-0 overflow-hidden rounded-xl">
          <Photo a={a} sizes="64px" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{a.title}</span>
          <span className="block truncate text-[13px] text-muted">{a.location}</span>
          {/* On phones the rating goes under the location, as the row is too narrow for it. */}
          <span className="block pt-0.5 text-[13px] sm:hidden">
            <Rating total={total} t={t} />
          </span>
        </span>
        <span className="hidden shrink-0 text-sm sm:block">
          <Rating total={total} t={t} />
        </span>
      </ActivityLink>
    </li>
  );
}

// Reads the database on every request, so a newly approved review counts on the next visit.
async function RankingList({ lang, searchParams }: { lang: Lang; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const t = dictionaries[lang];
  const activities = activitiesIn(lang);
  const { ranked, unranked, sharedRank } = rankActivities(activities, ratingTotals(), t.htmlLang);
  // A shared link like /top?aktivnost=kravice opens with that activity's details open.
  const id = activityFromQuery(await searchParams);
  return (
    <ActivityPopups initialActivityId={activities.some((a) => a.id === id) ? id : null}>
      {ranked.length > 0 ? (
        <section aria-label={t.top.rankedLabel} className="rounded-[30px] bg-surface px-4 pt-6 pb-6 shadow-card sm:px-6">
          <ol className="m-0 grid list-none grid-cols-1 gap-[18px] p-0 sm:grid-cols-3">
            {ranked.slice(0, PODIUM_SIZE).map((entry, i) => (
              <PodiumCard key={entry.activity.id} entry={entry} rank={i + 1} t={t} />
            ))}
          </ol>
          {ranked.length > PODIUM_SIZE && (
            <ol start={PODIUM_SIZE + 1} className="m-0 mt-5 grid list-none grid-cols-1 gap-2.5 p-0">
              {ranked.slice(PODIUM_SIZE).map((entry, i) => (
                <Row key={entry.activity.id} entry={entry} rank={PODIUM_SIZE + i + 1} t={t} />
              ))}
            </ol>
          )}
        </section>
      ) : (
        <p className="rounded-[30px] bg-surface p-8 text-center text-muted shadow-card">{t.top.noneRanked(MIN_REVIEWS_FOR_RANK)}</p>
      )}

      {unranked.length > 0 && (
        <section aria-labelledby="zajednicko-mjesto" className="rounded-[30px] bg-surface px-4 pt-[26px] pb-6 shadow-card sm:px-6">
          <h2 id="zajednicko-mjesto" className="px-2 font-serif text-[clamp(24px,3vw,30px)] leading-tight">
            {t.top.shared(sharedRank)}
          </h2>
          <p className="mt-1 px-2 text-muted">{t.top.sharedNote(MIN_REVIEWS_FOR_RANK)}</p>
          <ul className="m-0 mt-5 grid list-none grid-cols-1 gap-2.5 p-0 lg:grid-cols-2">
            {unranked.map((entry) => (
              <Row key={entry.activity.id} entry={entry} rank={sharedRank} t={t} />
            ))}
          </ul>
        </section>
      )}
    </ActivityPopups>
  );
}

export default async function TopDestinations({ params, searchParams }: PageProps<"/[lang]/top">) {
  const lang = langOf((await params).lang);
  const t = dictionaries[lang];
  return (
    <PageShell lang={lang} active="top" className="space-y-6">
      <PageHeader title={t.top.title} intro={`${t.top.intro} ${t.top.rule(MIN_REVIEWS_FOR_RANK)}`} paths={topPath} />
      <Suspense fallback={<p className="rounded-[30px] bg-surface p-8 text-center text-muted shadow-card">{t.top.loading}</p>}>
        <RankingList lang={lang} searchParams={searchParams} />
      </Suspense>
    </PageShell>
  );
}
