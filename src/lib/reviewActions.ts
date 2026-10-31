"use server";

import { activities } from "@/data/activities";
import { getDb } from "@/lib/db";
import { senderHash } from "@/lib/sender";
import {
  REVIEW_KIDS_MAX,
  REVIEW_MONTHS_BACK,
  REVIEW_NAME_MAX,
  REVIEW_TEXT_MAX,
  REVIEW_TEXT_MIN,
  type ReviewError,
  type ReviewFormState,
} from "@/lib/reviewLimits";

// Anyone can send this function a request without using the form, so everything is checked here
// again, and reviews only ever go in as "pending": nothing a visitor sends shows on the site
// before it has been approved.

/** A form filled in faster than this was not typed by a person. */
const MIN_FILL_MS = 4000;
/** Per sender: one review of the same activity per day, and a few reviews an hour overall. */
const MAX_PER_HOUR = 5;

const activityIds = new Set(activities.map((a) => a.id));

function text(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

/** "2026-10" for a month from the last few years up to now; null when empty; false when invalid. */
function visitMonth(value: string): string | null | false {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return false;
  const months = Number(match[1]) * 12 + Number(match[2]) - 1;
  const now = new Date();
  const thisMonth = now.getFullYear() * 12 + now.getMonth();
  return Number(match[2]) >= 1 && months <= thisMonth && months >= thisMonth - REVIEW_MONTHS_BACK ? value : false;
}

export async function submitReview(_previous: ReviewFormState, form: FormData): Promise<ReviewFormState> {
  // The hidden "website" field is invisible to people; bots that fill in every field give themselves away.
  // They get the same answer as everyone else, so they cannot tell it did not work.
  if (text(form, "website")) return { status: "sent" };

  const errors: ReviewError[] = [];
  const activityId = text(form, "activityId");
  const rating = Number(text(form, "rating"));
  const body = text(form, "text");
  const author = text(form, "author");
  const kidsAges = text(form, "kidsAges");
  const month = visitMonth(text(form, "visitMonth"));
  const lang = text(form, "lang") === "en" ? "en" : "bs";
  const startedAt = Number(text(form, "startedAt"));

  if (!activityIds.has(activityId)) errors.push("activity");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.push("rating");
  if (body.length < REVIEW_TEXT_MIN) errors.push("textShort");
  if (body.length > REVIEW_TEXT_MAX) errors.push("textLong");
  if (author.length > REVIEW_NAME_MAX) errors.push("nameLong");
  if (kidsAges.length > REVIEW_KIDS_MAX) errors.push("kidsLong");
  if (month === false) errors.push("month");
  if (errors.length) return { status: "error", errors };

  if (!Number.isFinite(startedAt) || Date.now() - startedAt < MIN_FILL_MS) return { status: "error", errors: ["tooFast"] };

  try {
    const db = getDb();
    const sender = await senderHash();
    const recent = db
      .prepare(
        `SELECT
           count(CASE WHEN created_at >= strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-1 hour') THEN 1 END) AS lastHour,
           count(CASE WHEN activity_id = ? THEN 1 END) AS sameActivity
         FROM reviews
         WHERE sender_hash = ? AND created_at >= strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-1 day')`,
      )
      .get(activityId, sender) as { lastHour: number; sameActivity: number };
    if (recent.sameActivity > 0) return { status: "error", errors: ["duplicate"] };
    if (recent.lastHour >= MAX_PER_HOUR) return { status: "error", errors: ["tooMany"] };

    db.prepare(
      `INSERT INTO reviews (activity_id, rating, text, author, kids_ages, visit_month, lang, sender_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(activityId, rating, body, author || null, kidsAges || null, month || null, lang, sender);
  } catch (e) {
    console.error("Saving a review failed:", e);
    return { status: "error", errors: ["server"] };
  }
  return { status: "sent" };
}
