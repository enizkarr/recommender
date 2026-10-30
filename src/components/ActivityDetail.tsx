"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import DirectionsLink from "@/components/DirectionsLink";
import MapTeaser from "@/components/MapTeaser";
import Photo from "@/components/Photo";
import { directionsUrl, formatDrive, tripKm, type Trip } from "@/lib/driving";
import { useT } from "@/i18n/LangProvider";
import { ACTIVITY_PARAM } from "@/lib/filtersUrl";
import type { StartLocation } from "@/lib/startLocation";
import type { Activity } from "@/lib/types";

function Fact({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-page px-3.5 py-3">
      <span className="text-xl" aria-hidden>
        {icon}
      </span>
      <p className="min-w-0 text-sm">
        <span className="block text-xs text-muted">{label}</span>
        {value}
      </p>
    </div>
  );
}

const pill = "inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-medium transition hover:bg-page";

function ActionButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={pill}>
      {children}
    </button>
  );
}

interface Props {
  activity: Activity;
  /** Distance and driving time from the starting point; missing without one, or while loading. */
  trip?: Trip;
  start: StartLocation | null;
  /** Other activities close to this one, nearest first. */
  nearby: Activity[];
  /** Shows another activity in the same popup. */
  onSelect: (id: string) => void;
  onClose: () => void;
}

/**
 * Everything about one activity, in a popup over the list: full screen on phones, a large panel
 * on bigger screens. Mount it to open it and unmount it to close it.
 */
export default function ActivityDetail({ activity: a, trip, start, nearby, onSelect, onClose }: Props) {
  const t = useT();
  const dialog = useRef<HTMLDialogElement>(null);
  const [shareNote, setShareNote] = useState<string | null>(null);

  // showModal() gives the dimmed backdrop, traps focus inside and closes on Escape.
  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  // Another activity picked from "U blizini": start reading it from the top.
  useEffect(() => {
    dialog.current?.scrollTo({ top: 0 });
  }, [a.id]);

  /** The phone's share sheet where there is one; otherwise the link is copied. */
  async function share() {
    const url = `${window.location.origin}${window.location.pathname}?${ACTIVITY_PARAM}=${a.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: a.title, text: `${a.title} – ${a.location}`, url });
      } catch {
        // Closing the share sheet is not an error worth showing.
      }
      return;
    }
    let copied = false;
    try {
      await navigator.clipboard.writeText(url);
      copied = true;
    } catch {
      // Older or stricter browsers: copy through a hidden text field instead.
      const field = document.createElement("textarea");
      field.value = url;
      field.style.position = "fixed";
      field.style.opacity = "0";
      dialog.current?.append(field);
      field.select();
      copied = document.execCommand("copy");
      field.remove();
    }
    setShareNote(copied ? t.detail.copied : t.detail.notCopied);
    setTimeout(() => setShareNote(null), 2500);
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby="activity-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // A click on the dialog element itself (not its content) is a click on the backdrop.
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="activity-detail m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto bg-surface [scrollbar-width:none] [&::-webkit-scrollbar]:hidden p-0 text-ink shadow-2xl backdrop:bg-[#14305a]/40 backdrop:backdrop-blur-[2px] sm:m-auto sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:w-[min(44rem,calc(100%-2rem))] sm:rounded-[30px]"
    >
      {/* Zero-height sticky row, so the close button stays in the corner while the content scrolls */}
      <div className="sticky top-0 z-10 flex h-0 justify-end p-3">
        <button
          type="button"
          onClick={onClose}
          aria-label={t.detail.close}
          className="grid size-10 place-items-center rounded-full bg-white/90 text-xl text-[#14305a] shadow-soft backdrop-blur transition hover:bg-white"
        >
          ✕
        </button>
      </div>

      <div className="p-3 pb-0 sm:p-4 sm:pb-0">
        <div className="relative aspect-[16/9] overflow-hidden rounded-3xl">
          <Photo key={a.id} a={a} eager sizes="(min-width: 640px) 44rem, 100vw" />
        </div>
      </div>

      <div className="space-y-6 px-5 pt-5 pb-8 sm:px-8">
        <header>
          <h2 id="activity-title" className="font-serif text-[clamp(30px,5vw,40px)] leading-tight">
            {a.title}
          </h2>
          <p className="mt-1 text-muted">📍 {a.location}</p>
          <p className="mt-3 text-sm font-medium text-accent">
            {trip
              ? t.detail.trip(tripKm(trip, t), start?.name ?? "", trip.minutes !== undefined ? formatDrive(trip.minutes, t) : null)
              : start
                ? t.calculating
                : t.detail.setStart}
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-2.5">
          <DirectionsLink
            href={directionsUrl(a.coordinates, start?.coordinates)}
            label={t.directionsLabel(a.title)}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-surface transition hover:opacity-90"
          >
            <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" aria-hidden>
              <path d="M3 11 21 3l-8 18-2-8z" />
            </svg>
            {t.directions}
          </DirectionsLink>
          <ActionButton onClick={share}>
            <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
              <circle cx={18} cy={5} r={2.5} />
              <circle cx={6} cy={12} r={2.5} />
              <circle cx={18} cy={19} r={2.5} />
              <path d="m8.2 10.9 7.6-4.3M8.2 13.1l7.6 4.3" />
            </svg>
            {t.detail.share}
          </ActionButton>
          {a.website && (
            <a href={a.website} target="_blank" rel="noopener noreferrer" className={pill}>
              {t.detail.website}
            </a>
          )}
          <span className="text-sm text-muted" aria-live="polite">
            {shareNote}
          </span>
        </div>

        <p className="text-[17px] leading-relaxed">{a.description}</p>

        <section aria-labelledby="info-title" className="rounded-3xl border border-line p-5">
          <h3 id="info-title" className="font-serif text-xl">
            {t.detail.info}
          </h3>
          <p className="mt-2 leading-relaxed text-muted">{a.info}</p>
          {t.detail.priceNote && <p className="mt-3 text-sm text-muted">💱 {t.detail.priceNote}</p>}
        </section>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <Fact icon="👶" label={t.detail.age} value={a.minAge === 0 ? t.detail.allAges : t.detail.fromAge(a.minAge)} />
          <Fact icon="⏱️" label={t.detail.duration} value={t.detail.hours(a.durationHours)} />
          <Fact icon="💰" label={t.detail.price} value={t.cost[a.cost]} />
          <Fact icon={a.indoor ? "🏠" : "🌤️"} label={t.detail.where} value={a.indoor ? t.indoor : t.outdoor} />
          <Fact icon={a.place === "nature" ? "🌲" : "🏛️"} label={t.detail.surroundings} value={t.place[a.place]} />
          {a.coffee && <Fact icon="☕" label={t.detail.forParents} value={t.detail.hasCoffee} />}
        </div>

        <div className="overflow-hidden rounded-3xl bg-[linear-gradient(140deg,color-mix(in_srgb,var(--soft)_22%,var(--surface)),var(--surface)_70%)] px-6 pt-4 pb-2">
          <div className="mx-auto max-w-[22rem]">
            <MapTeaser
              dots={nearby.map((n) => n.coordinates)}
              from={start ? { label: start.name, coordinates: start.coordinates } : undefined}
              to={{ label: a.title, coordinates: a.coordinates }}
            />
          </div>
        </div>

        {nearby.length > 0 && (
          <section aria-labelledby="nearby-title">
            <h3 id="nearby-title" className="font-serif text-xl">
              {t.detail.nearby}
            </h3>
            <ul className="mt-3 grid gap-2.5 sm:grid-cols-3">
              {nearby.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(n.id)}
                    className="flex w-full items-center gap-3 rounded-2xl bg-page p-2 text-left transition hover:bg-line/60 sm:flex-col sm:items-stretch"
                  >
                    <span className="relative h-14 w-16 shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-full">
                      <Photo a={n} sizes="(min-width: 640px) 13rem, 64px" />
                    </span>
                    <span className="min-w-0 px-1 sm:pb-1">
                      <span className="block truncate text-sm font-medium">{n.title}</span>
                      <span className="block truncate text-xs text-muted">{n.location}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </dialog>
  );
}
