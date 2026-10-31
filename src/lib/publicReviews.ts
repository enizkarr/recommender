"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { PublicReview, RatingSummary } from "@/lib/reviewLimits";

// Approved reviews, read from the site's own API. The averages for all cards are loaded once per
// page visit and shared by every component that shows them; a popup loads its own reviews.

let summaries: Record<string, RatingSummary> | null = null;
let requested = false;
const listeners = new Set<() => void>();

function loadSummaries() {
  if (requested) return;
  requested = true;
  fetch("/api/reviews")
    .then((r) => (r.ok ? r.json() : { summaries: {} }))
    .catch(() => ({ summaries: {} }))
    .then((data: { summaries: Record<string, RatingSummary> }) => {
      // Without reviews (or when the API cannot be reached) the cards simply show no rating.
      summaries = data.summaries ?? {};
      listeners.forEach((l) => l());
    });
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/** Average and count per activity id; null until loaded, and on the server. */
export function useRatingSummaries(): Record<string, RatingSummary> | null {
  const value = useSyncExternalStore(subscribe, () => summaries, () => null);
  useEffect(loadSummaries, []);
  return value;
}

export type ReviewsState = { status: "loading" } | { status: "error" } | { status: "ready"; reviews: PublicReview[] };

/** The approved reviews of one activity. Key the component by activity so a new one starts loading afresh. */
export function useApprovedReviews(activityId: string): ReviewsState {
  const [state, setState] = useState<ReviewsState>({ status: "loading" });
  useEffect(() => {
    let current = true;
    fetch(`/api/reviews/${encodeURIComponent(activityId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { reviews: PublicReview[] }) => current && setState({ status: "ready", reviews: data.reviews }))
      .catch(() => current && setState({ status: "error" }));
    return () => {
      current = false;
    };
  }, [activityId]);
  return state;
}
