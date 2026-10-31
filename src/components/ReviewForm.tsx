"use client";

import { useActionState, useEffect, useState, useSyncExternalStore } from "react";
import { useLang, useT } from "@/i18n/LangProvider";
import { submitReview } from "@/lib/reviewActions";
import { REVIEW_KIDS_MAX, REVIEW_MONTHS_BACK, REVIEW_NAME_MAX, REVIEW_TEXT_MAX, type ReviewFormState } from "@/lib/reviewLimits";

// Activities this browser has already reviewed, so the form is not offered twice. The server has
// its own limit; this is only so a family does not fill the form in again by mistake.
const STORAGE_KEY = "family-time:reviewed";
const listeners = new Set<() => void>();

function readReviewed(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function markReviewed(id: string) {
  const ids = new Set(readReviewed().split(",").filter(Boolean));
  ids.add(id);
  try {
    localStorage.setItem(STORAGE_KEY, [...ids].join(","));
  } catch {
    // Storage blocked: the server's limit still applies.
  }
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function useReviewed(id: string): boolean {
  const raw = useSyncExternalStore(subscribe, readReviewed, () => "");
  return raw.split(",").includes(id);
}

/** "2026-10" for a date, as <input type="month"> uses it. */
const monthValue = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const field =
  "w-full rounded-2xl border border-line bg-page px-4 py-2.5 text-[15px] text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none";
const label = "mb-1.5 block text-sm font-medium";

const initialState: ReviewFormState = { status: "idle" };

/** "Ostavi recenziju": a short form in the activity popup. Reviews are saved as pending until approved. */
export default function ReviewForm({ activityId }: { activityId: string }) {
  const t = useT();
  const lang = useLang();
  const reviewed = useReviewed(activityId);
  const [state, formAction, pending] = useActionState(submitReview, initialState);
  // Opening the form records the time (for the server's "typed too fast" check) and this month (the latest allowed).
  const [openedAt, setOpenedAt] = useState<Date | null>(null);
  // Controlled fields: React clears a form after its action runs, which would throw away the text
  // when the server sends back a correction.
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [kidsAges, setKidsAges] = useState("");
  const [visitMonth, setVisitMonth] = useState("");

  const sent = state.status === "sent";
  useEffect(() => {
    if (sent) markReviewed(activityId);
  }, [sent, activityId]);

  if (sent) {
    return (
      <div role="status" className="rounded-3xl bg-page p-5">
        <p className="font-serif text-xl">{t.reviews.thanks}</p>
        <p className="mt-1 text-muted">{t.reviews.thanksText}</p>
      </div>
    );
  }

  if (reviewed) return <p className="text-muted">{t.reviews.already}</p>;

  if (!openedAt) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-page p-5">
        <p className="text-muted">{t.reviews.intro}</p>
        <button
          type="button"
          onClick={() => setOpenedAt(new Date())}
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-surface transition hover:opacity-90"
        >
          {t.reviews.write}
        </button>
      </div>
    );
  }

  const earliest = new Date(openedAt.getFullYear(), openedAt.getMonth() - REVIEW_MONTHS_BACK, 1);
  const errors = state.status === "error" ? state.errors : [];

  return (
    <form action={formAction} className="space-y-4 rounded-3xl border border-line p-5">
      <input type="hidden" name="activityId" value={activityId} />
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="startedAt" value={openedAt.getTime()} />
      {/* A trap for bots: hidden from people and screen readers, so only a bot fills it in. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      <fieldset>
        <legend className={label}>{t.reviews.rating}</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer">
              <input
                type="radio"
                name="rating"
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
                required
                className="peer sr-only"
              />
              <span className="sr-only">{t.reviews.stars(n)}</span>
              <span
                aria-hidden
                className={`block text-[32px] leading-none transition peer-focus-visible:rounded peer-focus-visible:ring-2 peer-focus-visible:ring-accent ${n <= rating ? "text-sun" : "text-line"}`}
              >
                ★
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="review-text" className={label}>
          {t.reviews.text}
        </label>
        <textarea
          id="review-text"
          name="text"
          rows={3}
          required
          maxLength={REVIEW_TEXT_MAX}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.reviews.textPlaceholder}
          className={`${field} resize-y`}
        />
        <p className="mt-1 text-right text-xs text-muted">{t.reviews.counter(text.length, REVIEW_TEXT_MAX)}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="review-author" className={label}>
            {t.reviews.author} <span className="font-normal text-muted">({t.reviews.optional})</span>
          </label>
          <input
            id="review-author"
            name="author"
            maxLength={REVIEW_NAME_MAX}
            autoComplete="given-name"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="review-kids" className={label}>
            {t.reviews.kidsAges} <span className="font-normal text-muted">({t.reviews.optional})</span>
          </label>
          <input
            id="review-kids"
            name="kidsAges"
            maxLength={REVIEW_KIDS_MAX}
            value={kidsAges}
            onChange={(e) => setKidsAges(e.target.value)}
            placeholder={t.reviews.kidsPlaceholder}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="review-month" className={label}>
            {t.reviews.visitMonth} <span className="font-normal text-muted">({t.reviews.optional})</span>
          </label>
          <input
            id="review-month"
            name="visitMonth"
            type="month"
            min={monthValue(earliest)}
            max={monthValue(openedAt)}
            value={visitMonth}
            onChange={(e) => setVisitMonth(e.target.value)}
            className={field}
          />
        </div>
      </div>

      {errors.length > 0 && (
        <ul role="alert" className="space-y-1 text-sm text-rose-700 dark:text-rose-300">
          {errors.map((e) => (
            <li key={e}>{t.reviews.errors[e]}</li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-surface transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? t.reviews.sending : t.reviews.submit}
        </button>
        <button type="button" onClick={() => setOpenedAt(null)} className="rounded-full border border-line px-5 py-2.5 text-sm font-medium transition hover:bg-page">
          {t.reviews.cancel}
        </button>
      </div>
      <p className="text-xs text-muted">{t.reviews.privacy}</p>
    </form>
  );
}
