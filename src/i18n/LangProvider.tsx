"use client";

import { createContext, useContext, type ReactNode } from "react";
import { activitiesIn } from "@/i18n/activities";
import { dictionaries, type Lang } from "@/i18n/dictionaries";

const LangContext = createContext<Lang>("bs");

/** Makes the page's language (from the URL) known to every component below it. */
export default function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang(): Lang {
  return useContext(LangContext);
}

/** The texts in the page's language. */
export function useT() {
  return dictionaries[useLang()];
}

/** All activities, with their texts in the page's language. */
export function useActivities() {
  return activitiesIn(useLang());
}
