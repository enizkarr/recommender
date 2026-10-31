import { connection } from "next/server";
import { ratingSummaries } from "@/lib/reviews";

// GET /api/reviews: average rating and count of approved reviews per activity, for the cards.
export async function GET() {
  // Read the database on every request; without this the build would run the query once and
  // keep serving that result.
  await connection();
  return Response.json({ summaries: ratingSummaries() }, { headers: { "Cache-Control": "no-store" } });
}
