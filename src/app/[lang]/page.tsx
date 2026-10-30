import { Suspense, type ReactNode } from "react";
import Recommender from "@/components/Recommender";
import { activities } from "@/data/activities";
import { dictionaries, isLang, type Dict } from "@/i18n/dictionaries";
import { activityFromQuery, prefsFromQuery } from "@/lib/filtersUrl";

function RailLink({ href, label, active = false, children }: { href: string; label: string; active?: boolean; children: ReactNode }) {
  return (
    <a
      href={href}
      aria-current={active ? "page" : undefined}
      className={`grid w-[60px] shrink-0 justify-items-center gap-1 rounded-[22px] px-1 py-2 text-xs lg:w-[68px] lg:py-3 lg:shadow-card ${active ? "bg-ink text-surface" : "bg-surface text-ink"}`}
    >
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {children}
      </svg>
      {label}
    </a>
  );
}

/** A rail item for a feature that is not built yet: not a link, faded, with an "Uskoro" badge. */
function RailSoon({ label, t, children }: { label: string; t: Dict; children: ReactNode }) {
  return (
    <div
      aria-label={t.soonLabel(label)}
      role="img"
      className="relative grid w-[60px] shrink-0 cursor-default justify-items-center gap-1 rounded-[22px] bg-surface px-1 py-2 text-xs text-muted lg:w-[68px] lg:py-3 lg:shadow-card"
    >
      <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-sun/90 px-1.5 py-px text-[9px] font-semibold text-[#14305a]">{t.soon}</span>
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {children}
      </svg>
      {label}
    </div>
  );
}

/** Slim navigation rail: on the left on large screens, a bar across the top on smaller ones. */
function Rail({ t }: { t: Dict }) {
  return (
    <nav
      aria-label={t.nav.label}
      className="flex items-center justify-between gap-2 overflow-x-auto rounded-[28px] bg-surface px-3.5 py-2.5 shadow-card lg:sticky lg:top-6 lg:flex-col lg:justify-start lg:gap-[18px] lg:self-start lg:overflow-visible lg:rounded-[40px] lg:px-2.5 lg:pt-[22px] lg:pb-[26px]"
    >
      <a href="#top" className="mr-1.5 grid shrink-0 justify-items-center gap-0.5 text-accent lg:mr-0 lg:mb-3.5">
        <svg width="40" height="26" viewBox="0 0 40 26" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" aria-hidden>
          <path d="M3 9c6-6 11-6 17 0s11 6 17 0" />
          <path d="M3 19c6-6 11-6 17 0s11 6 17 0" opacity={0.55} />
        </svg>
        <span className="hidden font-script text-[22px] leading-none whitespace-nowrap sm:block">Family Time</span>
      </a>
      <RailLink href="#top" label={t.nav.home} active>
        <path d="M12 3 2.5 11h2.7v9h5.3v-6h3v6h5.3v-9h2.7z" fill="currentColor" stroke="none" />
      </RailLink>
      <RailLink href="#aktivnosti" label={t.nav.explore}>
        <circle cx={12} cy={12} r={9} />
        <path d="m15.5 8.5-2 5-5 2 2-5z" />
      </RailLink>
      <RailLink href="#mapa" label={t.nav.map}>
        <path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z" />
        <path d="M9 4v13.5M15 6.5V20" />
      </RailLink>
      <RailSoon label={t.nav.reviews} t={t}>
        {/* A speech bubble with a star */}
        <path d="M4 5h16v11H10l-4 3.5V16H4z" />
        <path d="m12 7.6.95 1.9 2.1.3-1.52 1.48.36 2.1L12 12.4l-1.89.98.36-2.1-1.52-1.48 2.1-.3z" fill="currentColor" strokeWidth={0.8} />
      </RailSoon>
    </nav>
  );
}

// The query is only read inside the Suspense boundary below, so the shell and the unfiltered
// view stay part of the prerendered page.
export default async function Home({ params, searchParams }: PageProps<"/[lang]">) {
  // Known at build time (both languages are prerendered), so awaiting it here keeps the shell static.
  const { lang } = await params;
  const t = dictionaries[isLang(lang) ? lang : "bs"];
  return (
    <div
      id="top"
      className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[92px_minmax(0,1fr)] lg:gap-7"
    >
      <Rail t={t} />
      <main className="min-w-0">
        <Suspense fallback={<Recommender initialPrefs={null} />}>
          {/* A shared link like ?mjesto=priroda opens with those filters already applied,
              and ?aktivnost=kravice with that activity's details open. */}
          {searchParams.then((query) => {
            const id = activityFromQuery(query);
            return (
              <Recommender
                initialPrefs={prefsFromQuery(query)}
                initialActivityId={activities.some((a) => a.id === id) ? id : null}
              />
            );
          })}
        </Suspense>
      </main>
    </div>
  );
}
