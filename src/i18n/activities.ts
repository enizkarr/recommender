import { activities } from "@/data/activities";
import { activitiesEn } from "@/data/activities.en";
import type { Lang } from "@/i18n/dictionaries";
import type { Activity } from "@/lib/types";

// Built once per language, so the list keeps the same identity between renders.
const english: Activity[] = activities.map((a) => ({ ...a, ...activitiesEn[a.id] }));
const byLang: Record<Lang, Activity[]> = { bs: activities, en: english };

/** All activities, with their title, location, description and practical information in that language. */
export function activitiesIn(lang: Lang): Activity[] {
  return byLang[lang];
}
