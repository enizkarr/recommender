// Limits for a review, shared by the form (to guide the visitor) and the server (which enforces them).
// The database has its own checks too; these are the friendlier, stricter rules on top.

export const REVIEW_TEXT_MIN = 10;
export const REVIEW_TEXT_MAX = 300;
export const REVIEW_NAME_MAX = 40;
export const REVIEW_KIDS_MAX = 40;
/** How far back a visit month may go. */
export const REVIEW_MONTHS_BACK = 36;

/** What can be wrong with a submitted review; the form turns each code into a sentence in its language. */
export type ReviewError =
  | "rating"
  | "textShort"
  | "textLong"
  | "nameLong"
  | "kidsLong"
  | "month"
  | "activity"
  | "tooFast"
  | "duplicate"
  | "tooMany"
  | "server";

export type ReviewFormState =
  | { status: "idle" }
  | { status: "sent" }
  | { status: "error"; errors: ReviewError[] };

/** What visitors see of an approved review; nothing about who sent it or how it was moderated. */
export interface PublicReview {
  id: number;
  rating: number;
  text: string;
  author: string | null;
  kidsAges: string | null;
  visitMonth: string | null;
  createdAt: string;
}

export interface RatingSummary {
  /** Rounded to one decimal. */
  average: number;
  count: number;
}
