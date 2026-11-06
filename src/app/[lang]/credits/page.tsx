import type { Metadata } from "next";
import PageShell, { PageHeader } from "@/components/PageShell";
import Photo from "@/components/Photo";
import PhotoCredit from "@/components/PhotoCredit";
import { activitiesIn } from "@/i18n/activities";
import { creditsPath, dictionaries, langOf } from "@/i18n/dictionaries";

export async function generateMetadata({ params }: PageProps<"/[lang]/credits">): Promise<Metadata> {
  const { lang } = await params;
  const t = dictionaries[langOf(lang)];
  return { title: `${t.credits.title} – Family Time`, description: t.credits.intro };
}

export default async function PhotoCredits({ params }: PageProps<"/[lang]/credits">) {
  const lang = langOf((await params).lang);
  const t = dictionaries[lang];
  const credited = activitiesIn(lang)
    .filter((a) => a.imageCredit)
    .sort((a, b) => a.title.localeCompare(b.title, t.htmlLang));
  return (
    <PageShell lang={lang} className="space-y-6">
      <PageHeader title={t.credits.title} intro={`${t.credits.intro} ${t.credits.changes}`} paths={creditsPath} />
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
    </PageShell>
  );
}
