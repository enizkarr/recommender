import type { Metadata } from "next";
import LanguageSwitch from "@/components/LanguageSwitch";
import Photo from "@/components/Photo";
import PhotoCredit from "@/components/PhotoCredit";
import Rail from "@/components/Rail";
import { activitiesIn } from "@/i18n/activities";
import { creditsPath, dictionaries, isLang } from "@/i18n/dictionaries";

export async function generateMetadata({ params }: PageProps<"/[lang]/credits">): Promise<Metadata> {
  const { lang } = await params;
  const t = dictionaries[isLang(lang) ? lang : "bs"];
  return { title: `${t.credits.title} – Family Time`, description: t.credits.intro };
}

export default async function PhotoCredits({ params }: PageProps<"/[lang]/credits">) {
  const { lang: requested } = await params;
  const lang = isLang(requested) ? requested : "bs";
  const t = dictionaries[lang];
  const credited = activitiesIn(lang)
    .filter((a) => a.imageCredit)
    .sort((a, b) => a.title.localeCompare(b.title, t.htmlLang));
  return (
    <div id="top" className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[92px_minmax(0,1fr)] lg:gap-7">
      <Rail lang={lang} />
      <main className="min-w-0 space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0 flex-[1_1_320px]">
            <h1 className="font-serif text-[clamp(32px,4vw,46px)] leading-tight">{t.credits.title}</h1>
            <p className="mt-1.5 text-[17px] text-muted">
              {t.credits.intro} {t.credits.changes}
            </p>
          </div>
          <LanguageSwitch paths={creditsPath} />
        </header>
        <section aria-label={t.credits.title} className="rounded-[30px] bg-surface px-4 py-6 shadow-card sm:px-6">
          <ul className="m-0 grid list-none grid-cols-1 gap-2.5 p-0 lg:grid-cols-2">
            {credited.map((a) => (
              <li key={a.id} className="flex items-center gap-3 rounded-2xl bg-page p-2 pr-4 sm:gap-4">
                <span className="relative h-14 w-16 shrink-0 overflow-hidden rounded-xl">
                  <Photo a={a} sizes="64px" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{a.title}</span>
                  <span className="block text-[13px] text-muted">
                    <PhotoCredit credit={a.imageCredit!} t={t} />
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
