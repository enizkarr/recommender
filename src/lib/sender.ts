import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";

// Mixed into the hash so it cannot be reversed into an IP address by trying them all.
// Set REVIEWS_SECRET to keep the limits working across restarts; without it a new secret
// is made each time the site starts, which only means the limits start over.
const secret = process.env.REVIEWS_SECRET ?? randomBytes(32).toString("hex");

// Behind Cloudflare Tunnel, Cloudflare puts the visitor's address in CF-Connecting-IP and overwrites
// any value the visitor sent. Set BEHIND_CLOUDFLARE=1 only then, and only when the site cannot be
// reached any other way (start it with -H 127.0.0.1), or the header could be forged.
// Headers like X-Forwarded-For are never trusted: anyone can send them, and Next.js keeps a value it
// is given, so a new one on every request would get around the limits.
const behindCloudflare = process.env.BEHIND_CLOUDFLARE === "1";

/**
 * A one-way fingerprint of the visitor's connection, used for spam and login limits.
 * The IP address itself is never stored. Without Cloudflare in front, every visitor counts as the
 * same sender, so the limits apply to the site as a whole.
 */
export async function senderHash(): Promise<string> {
  const ip = behindCloudflare ? ((await headers()).get("cf-connecting-ip") ?? "unknown") : "direct";
  return createHash("sha256").update(`${secret}:${ip}`).digest("hex");
}
