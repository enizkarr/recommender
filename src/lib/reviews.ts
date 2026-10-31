import "server-only";
import { getDb } from "@/lib/db";
import type { PublicReview, RatingSummary } from "@/lib/reviewLimits";

// Reading and changing stored reviews. Only server code imports this; the admin page uses it
// through its actions, which check the login first.

export const REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const isReviewStatus = (value: unknown): value is ReviewStatus =>
  typeof value === "string" && (REVIEW_STATUSES as readonly string[]).includes(value);

export interface StoredReview {
  id: number;
  activityId: string;
  rating: number;
  text: string;
  author: string | null;
  kidsAges: string | null;
  visitMonth: string | null;
  lang: "bs" | "en";
  status: ReviewStatus;
  createdAt: string;
  reviewedAt: string | null;
}

/** Reviews with one status: the waiting queue oldest first (so none is forgotten), the others newest first. */
export function listReviews(status: ReviewStatus, limit = 100): StoredReview[] {
  const order = status === "pending" ? "created_at ASC" : "coalesce(reviewed_at, created_at) DESC";
  const rows = getDb()
    .prepare(
      `SELECT id, activity_id AS activityId, rating, text, author, kids_ages AS kidsAges,
              visit_month AS visitMonth, lang, status, created_at AS createdAt, reviewed_at AS reviewedAt
       FROM reviews WHERE status = ? ORDER BY ${order} LIMIT ?`,
    )
    .all(status, limit);
  // node:sqlite returns objects without a prototype; spreading gives plain ones that React can pass on.
  return rows.map((r) => ({ ...r }) as unknown as StoredReview);
}

export function reviewCounts(): Record<ReviewStatus, number> {
  const counts: Record<ReviewStatus, number> = { pending: 0, approved: 0, rejected: 0 };
  const rows = getDb().prepare("SELECT status, count(*) AS n FROM reviews GROUP BY status").all() as { status: ReviewStatus; n: number }[];
  for (const { status, n } of rows) counts[status] = n;
  return counts;
}

export function setReviewStatus(id: number, status: ReviewStatus) {
  getDb()
    .prepare(
      `UPDATE reviews SET status = ?,
         reviewed_at = CASE WHEN ? = 'pending' THEN NULL ELSE strftime('%Y-%m-%dT%H:%M:%SZ', 'now') END
       WHERE id = ?`,
    )
    .run(status, status, id);
}

/** Permanently removes a review, but only one that was already rejected. */
export function deleteRejectedReview(id: number) {
  getDb().prepare("DELETE FROM reviews WHERE id = ? AND status = 'rejected'").run(id);
}

/** Average rating and number of approved reviews, for every activity that has any. */
export function ratingSummaries(): Record<string, RatingSummary> {
  const rows = getDb()
    .prepare("SELECT activity_id AS activityId, avg(rating) AS average, count(*) AS count FROM reviews WHERE status = 'approved' GROUP BY activity_id")
    .all() as { activityId: string; average: number; count: number }[];
  return Object.fromEntries(rows.map((r) => [r.activityId, { average: Math.round(r.average * 10) / 10, count: r.count }]));
}

/** The latest approved reviews of one activity, with only the fields the public may see. */
export function approvedReviews(activityId: string, limit = 20): PublicReview[] {
  const rows = getDb()
    .prepare(
      `SELECT id, rating, text, author, kids_ages AS kidsAges, visit_month AS visitMonth, created_at AS createdAt
       FROM reviews WHERE activity_id = ? AND status = 'approved' ORDER BY created_at DESC LIMIT ?`,
    )
    .all(activityId, limit);
  return rows.map((r) => ({ ...r }) as unknown as PublicReview);
}
