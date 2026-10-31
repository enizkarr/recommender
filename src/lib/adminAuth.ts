import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// The admin page has one user: the site's owner, who logs in with ADMIN_PASSWORD from .env.local.
// A successful login sets a signed cookie; nothing about the session is stored on the server.

export const ADMIN_COOKIE = "ft_admin";
const SESSION_DAYS = 7;
export const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;
/** Shorter passwords are refused, so the admin page stays off until a real one is set. */
export const MIN_PASSWORD_LENGTH = 10;

const password = () => process.env.ADMIN_PASSWORD ?? "";

export const adminConfigured = () => password().length >= MIN_PASSWORD_LENGTH;

// Sessions are signed with a key made from the password, so changing the password logs out every session.
const signingKey = () => createHash("sha256").update(`family-time-admin:${password()}`).digest();
const sign = (value: string) => createHmac("sha256", signingKey()).update(value).digest("hex");
const sha256 = (value: string) => createHash("sha256").update(value).digest();

/** Compares in constant time, so the response time gives nothing away about the password. */
export function passwordMatches(input: string): boolean {
  return adminConfigured() && timingSafeEqual(sha256(input), sha256(password()));
}

/** Cookie value for a new session: when it expires, and a signature over that. */
export function newSessionValue(): string {
  const expires = String(Date.now() + SESSION_MAX_AGE * 1000);
  return `${expires}.${sign(expires)}`;
}

/** Whether this request comes from the logged-in owner. Every admin action checks this again. */
export async function isAdmin(): Promise<boolean> {
  if (!adminConfigured()) return false;
  const value = (await cookies()).get(ADMIN_COOKIE)?.value ?? "";
  const [expires, signature] = value.split(".");
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  const expected = sign(expires);
  return signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// Wrong passwords per sender, kept in memory: after a few, logins from there pause for a while.
const MAX_FAILURES = 5;
const BLOCK_MS = 15 * 60 * 1000;
const failures = new Map<string, number[]>();

function recentFailures(sender: string): number[] {
  const recent = (failures.get(sender) ?? []).filter((at) => Date.now() - at < BLOCK_MS);
  if (recent.length) failures.set(sender, recent);
  else failures.delete(sender);
  return recent;
}

export const loginBlocked = (sender: string) => recentFailures(sender).length >= MAX_FAILURES;

export function recordFailedLogin(sender: string) {
  failures.set(sender, [...recentFailures(sender), Date.now()]);
}

export const clearFailedLogins = (sender: string) => failures.delete(sender);
