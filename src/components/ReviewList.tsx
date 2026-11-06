"use client";

import { useT } from "@/i18n/LangProvider";
import { useApprovedReviews } from "@/lib/publicReviews";
import type { RatingSummary } from "@/lib/reviewLimits";

/** "★★★★☆" with the empty stars dimmed; the number is given to screen readers separately. */
function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  const full = Math.round(rating);
  return (
    <span aria-hidden className={`tracking-wide text-sun ${className}`}>
      {"★".repeat(full)}
      <span className="text-line">{"★".repeat(5 - full)}</span>
    </span>
  );
}

/** Average rating and the approved reviews of one activity, newest first. Key it by activity. */
export default function ReviewList({ activityId, summary }: { activityId: string; summary?: RatingSummary }) {
  const t = useT();
  const state = useApprovedReviews(activityId);

  if (state.status === "loading") return <p className="text-sm text-muted">{t.reviews.loading}</p>;
  if (state.status === "error") return <p className="text-sm text-muted">{t.reviews.loadError}</p>;
  if (state.reviews.length === 0) return <p className="text-muted">{t.reviews.none}</p>;

  // The summary comes from the cards' shared list; fall back to the reviews loaded here.
  const count = summary?.count ?? state.reviews.length;
  const average = summary?.average ?? state.reviews.reduce((sum, r) => sum + r.rating, 0) / state.reviews.length;

  return (
    <div className="space-y-4">
      <p className="flex items-center gap-2" aria-label={t.reviews.averageLabel(t.reviews.average(average), t.reviews.count(count))}>
        <Stars rating={average} className="text-xl" />
        <span aria-hidden className="font-medium">
          {t.reviews.average(average)}
        </span>
        <span aria-hidden className="text-sm text-muted">
          · {t.reviews.count(count)}
        </span>
      </p>
      <ul className="space-y-3">
        {state.reviews.map((r) => {
          const [year, month] = r.visitMonth?.split("-").map(Number) ?? [];
          const details = [
            r.kidsAges && t.reviews.kids(r.kidsAges),
            year && month && t.reviews.visited(`${t.months[month - 1]} ${year}`),
          ].filter(Boolean);
          return (
            <li key={r.id} className="rounded-2xl bg-page p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">{r.author || t.reviews.anonymous}</p>
                <p>
                  <Stars rating={r.rating} />
                  <span className="sr-only">{t.reviews.stars(r.rating)}</span>
                </p>
              </div>
              <p className="mt-1.5 leading-relaxed">{r.text}</p>
              {details.length > 0 && <p className="mt-1.5 text-xs text-muted">{details.join(" · ")}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
