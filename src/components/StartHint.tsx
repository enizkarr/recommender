"use client";

import { useEffect, useLayoutEffect, useState, useSyncExternalStore, type RefObject } from "react";
import { useT } from "@/i18n/LangProvider";

// Remembered in the browser once the hint has been closed, so it only greets first-time visitors.
const STORAGE_KEY = "family-time:start-hint-seen";

function hintSeen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // Storage blocked: better to skip the hint than to show it on every visit.
    return true;
  }
}

export function markStartHintSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Storage blocked: nothing to remember.
  }
}

const noSubscription = () => () => {};

/** True for a visitor who has never closed the hint; false on the server. */
export function useFirstVisit(): boolean {
  return useSyncExternalStore(noSubscription, () => !hintSeen(), () => false);
}

interface Hole {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
}

const GAP = 8; // room between the card and the edge of the cut-out

/** The page dimmed everywhere except a rounded window around `target`, as a clip-path. */
function dimmedOutside({ x, y, w, h, r }: Hole): string {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const hole =
    `M${x + r},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} V${y + h - r} A${r},${r} 0 0 1 ${x + w - r},${y + h} ` +
    `H${x + r} A${r},${r} 0 0 1 ${x},${y + h - r} V${y + r} A${r},${r} 0 0 1 ${x + r},${y} Z`;
  return `path(evenodd, 'M0,0 H${W} V${H} H0 Z ${hole}')`;
}

/**
 * First-visit hint: dims the page except the "Polazište" card and points at it with an arrow.
 * The card stays usable through the cut-out. Only the ✕ button or Escape closes the hint: clicks on the
 * dimmed page are swallowed, because a first click there is usually an accident, made before reading.
 */
export default function StartHint({ target, onClose }: { target: RefObject<HTMLElement | null>; onClose: () => void }) {
  const t = useT();
  const [hole, setHole] = useState<Hole | null>(null);

  // Follow the card while the page scrolls or resizes.
  useLayoutEffect(() => {
    const el = target.current;
    if (!el) return;
    const measure = () => {
      const box = el.getBoundingClientRect();
      const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
      setHole({ x: box.left - GAP, y: box.top - GAP, w: box.width + 2 * GAP, h: box.height + 2 * GAP, r: radius + GAP });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [target]);

  // On small screens the card is further down the page; bring it into view.
  useEffect(() => {
    const box = target.current?.getBoundingClientRect();
    if (box && (box.top < 0 || box.bottom > window.innerHeight)) {
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "center" });
    }
  }, [target]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!hole) return null;

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      {/* Clicks inside the cut-out reach the card; clicks on the dimmed part do nothing. */}
      <div className="hint-fade absolute inset-0 bg-[#14305a]/45" style={{ clipPath: dimmedOutside(hole) }} />
      <div
        className="hint-fade pointer-events-none absolute flex -translate-x-1/2 -translate-y-full flex-col items-center gap-1 pb-2 text-center"
        style={{ left: hole.x + hole.w / 2, top: hole.y }}
      >
        <div className="flex items-center gap-1 rounded-full bg-surface py-1 pr-1 pl-4 text-sm font-medium text-ink shadow-card">
          <p>
            {t.start.hint} <span className="text-muted">{t.start.hintOptional}</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.start.closeHint}
            className="pointer-events-auto grid size-7 shrink-0 place-items-center rounded-full text-muted transition hover:bg-page hover:text-ink"
          >
            ✕
          </button>
        </div>
        <svg viewBox="0 0 24 40" className="h-10 w-6 text-sun motion-safe:animate-bounce" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 3 V36 M3 27 L12 36 L21 27" />
        </svg>
      </div>
    </div>
  );
}
