import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";

// Mixed into the hash so it cannot be reversed into an IP address by trying them all.
// Set REVIEWS_SECRET to keep the limits working across restarts; without it a new secret
// is made each time the site starts, which only means the limits start over.
const secret = process.env.REVIEWS_SECRET ?? randomBytes(32).toString("hex");

/**
 * A one-way fingerprint of the visitor's connection, used for spam and login limits.
 * The IP address itself is never stored.
 */
export async function senderHash(): Promise<string> {
  const h = await headers();
  // Cloudflare Tunnel passes the visitor's address in CF-Connecting-IP; locally there is none.
  const ip = h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  return createHash("sha256").update(`${secret}:${ip}`).digest("hex");
}
