import type { ReactNode } from "react";
import LanguageSwitch from "@/components/LanguageSwitch";
import Rail from "@/components/Rail";
import type { Lang } from "@/i18n/dictionaries";

/** The frame every page shares: the navigation rail, and the page's own content beside it. */
export default function PageShell({ lang, active, className = "", children }: { lang: Lang; active?: "home" | "top"; className?: string; children: ReactNode }) {
  return (
    <div id="top" className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[92px_minmax(0,1fr)] lg:gap-7">
      <Rail lang={lang} active={active} />
      <main className={`min-w-0 ${className}`}>{children}</main>
    </div>
  );
}

/** A page's title and introduction, with the language switch beside them. `paths` says where this page lives in each language. */
export function PageHeader({ title, intro, paths }: { title: string; intro: string; paths: Record<Lang, string> }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-6">
      <div className="min-w-0 flex-[1_1_320px]">
        <h1 className="font-serif text-[clamp(32px,4vw,46px)] leading-tight">{title}</h1>
        <p className="mt-1.5 text-[17px] text-muted">{intro}</p>
      </div>
      <LanguageSwitch paths={paths} />
    </header>
  );
}
