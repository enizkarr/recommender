"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  adminConfigured,
  clearFailedLogins,
  isAdmin,
  loginBlocked,
  newSessionValue,
  passwordMatches,
  recordFailedLogin,
  SESSION_MAX_AGE,
} from "@/lib/adminAuth";
import { deleteRejectedReview, isReviewStatus, setReviewStatus } from "@/lib/reviews";
import { senderHash } from "@/lib/sender";

// Like every server function, these can be called by anyone who sends the right request, so each
// one checks the login itself instead of trusting that only the admin page shows its buttons.

export type LoginState = { error: "wrong" | "blocked" | "notConfigured" | null };

export async function login(_previous: LoginState, form: FormData): Promise<LoginState> {
  if (!adminConfigured()) return { error: "notConfigured" };
  const sender = await senderHash();
  if (loginBlocked(sender)) return { error: "blocked" };

  const input = form.get("password");
  if (typeof input !== "string" || !passwordMatches(input)) {
    recordFailedLogin(sender);
    return { error: loginBlocked(sender) ? "blocked" : "wrong" };
  }

  clearFailedLogins(sender);
  // Setting the cookie re-renders the page, which then shows the reviews.
  (await cookies()).set(ADMIN_COOKIE, newSessionValue(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return { error: null };
}

export async function logout() {
  (await cookies()).delete(ADMIN_COOKIE);
}

/** Odobri / Odbij / Vrati na čekanje: the clicked button sends the new status. */
export async function decideReview(form: FormData) {
  if (!(await isAdmin())) return;
  const id = Number(form.get("id"));
  const status = form.get("status");
  if (!Number.isInteger(id) || !isReviewStatus(status)) return;
  setReviewStatus(id, status);
  refresh();
}

export async function removeReview(form: FormData) {
  if (!(await isAdmin())) return;
  const id = Number(form.get("id"));
  if (!Number.isInteger(id)) return;
  deleteRejectedReview(id);
  refresh();
}
