"use client";

import { useRouter } from "next/navigation";
import { useLang, useT } from "@/i18n/LangProvider";
import { homePath, langNames, LANGS } from "@/i18n/dictionaries";

/**
 * "BS | EN": opens the same page in the other language, keeping the filters and an open activity
 * (they are in the query part of the address, which is the same in both languages).
 */
export default function LanguageSwitch({ className = "" }: { className?: string }) {
  const lang = useLang();
  const t = useT();
  const router = useRouter();
  return (
    <nav aria-label={t.nav.language} className={`flex shrink-0 rounded-full bg-surface p-1 shadow-card ${className}`}>
      {LANGS.map((l) => (
        <a
          key={l}
          href={homePath[l]}
          hrefLang={l}
          lang={l}
          aria-label={langNames[l]}
          title={langNames[l]}
          aria-current={l === lang ? "page" : undefined}
          onClick={(e) => {
            e.preventDefault();
            // The query is read at click time: filters change it without a re-render here.
            if (l !== lang) router.push(`${homePath[l]}${window.location.search}`, { scroll: false });
          }}
          className={`rounded-full px-3 py-2 text-[13px] font-semibold uppercase transition ${l === lang ? "bg-ink text-surface" : "text-muted hover:text-ink"}`}
        >
          {l}
        </a>
      ))}
    </nav>
  );
}
