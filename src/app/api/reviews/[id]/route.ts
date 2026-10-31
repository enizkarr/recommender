import { connection } from "next/server";
import { activities } from "@/data/activities";
import { approvedReviews } from "@/lib/reviews";

const activityIds = new Set(activities.map((a) => a.id));

// GET /api/reviews/<activity id>: the latest approved reviews of one activity, for its popup.
export async function GET(_request: Request, { params }: RouteContext<"/api/reviews/[id]">) {
  await connection();
  const { id } = await params;
  if (!activityIds.has(id)) return Response.json({ error: "Unknown activity" }, { status: 404 });
  return Response.json({ reviews: approvedReviews(id) }, { headers: { "Cache-Control": "no-store" } });
}
