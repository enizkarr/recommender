"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Dict } from "@/i18n/dictionaries";
import { useT } from "@/i18n/LangProvider";
import { noFilters } from "@/lib/filtersUrl";
import type { Preferences } from "@/lib/types";

// Small line icons in the style of the filter design (stroke follows the text colour).
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

export function SlidersIcon() {
  return (
    <Icon>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx={16} cy={7} r={2} />
      <circle cx={10} cy={17} r={2} />
    </Icon>
  );
}

const anyIcon = (
  <Icon>
    <rect x={4} y={4} width={6} height={6} rx={1.5} />
    <rect x={14} y={4} width={6} height={6} rx={1.5} />
    <rect x={4} y={14} width={6} height={6} rx={1.5} />
    <rect x={14} y={14} width={6} height={6} rx={1.5} />
  </Icon>
);
const natureIcon = (
  <Icon>
    <path d="M12 3 6 13h3l-4 6h14l-4-6h3z" />
    <path d="M12 19v2" />
  </Icon>
);
const cityIcon = (
  <Icon>
    <path d="M4 21V8l6-3v16M10 21V11h10v10M3 21h18" />
    <path d="M14 14h2M14 17h2" />
  </Icon>
);

interface Option<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

/** The choices for each filter, labelled in the page's language. */
function optionsFor(t: Dict) {
  return {
    place: [
      { value: "any", label: t.filters.any, icon: anyIcon },
      { value: "nature", label: t.place.nature, icon: natureIcon },
      { value: "city", label: t.place.city, icon: cityIcon },
    ] satisfies Option<Preferences["place"]>[],
    setting: [
      { value: "any", label: t.filters.any },
      { value: "indoor", label: t.indoor },
      { value: "outdoor", label: t.outdoor },
    ] satisfies Option<Preferences["setting"]>[],
    distance: [
      { value: "any", label: t.filters.any },
      { value: "near", label: t.filters.near },
      { value: "far", label: t.filters.far },
    ] satisfies Option<Preferences["distance"]>[],
    radius: [
      { value: "any", label: t.filters.any },
      { value: "30", label: t.filters.upToKm("30") },
      { value: "60", label: t.filters.upToKm("60") },
      { value: "120", label: t.filters.upToKm("120") },
    ] satisfies Option<Preferences["radius"]>[],
    budget: [
      { value: "any", label: t.filters.budgetAny },
      { value: "free", label: t.filters.budgetFree },
      { value: "moderate", label: t.cost.moderate },
    ] satisfies Option<Preferences["budget"]>[],
  };
}

/**
 * A row of options on a grey track; the chosen one is a white pill. Real radio inputs underneath
 * keep it usable with the keyboard (arrow keys) and screen readers.
 */
function Segmented<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  large = false,
}: {
  legend?: string;
  name: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  large?: boolean;
}) {
  const t = useT();
  return (
    <fieldset className="min-w-0">
      {legend ? (
        <legend className="mb-2 text-sm text-muted">{legend}</legend>
      ) : (
        <legend className="sr-only">{t.filters.natureOrCity}</legend>
      )}
      <div className="flex rounded-full bg-page p-1">
        {options.map((o) => (
          <label key={o.value} className="flex-1">
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="peer sr-only"
            />
            <span
              className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-full text-sm whitespace-nowrap text-muted transition peer-checked:bg-surface peer-checked:font-medium peer-checked:text-ink peer-checked:shadow-[0_1px_4px_rgba(0,0,0,0.12)] peer-focus-visible:ring-2 peer-focus-visible:ring-accent hover:text-ink ${large ? "px-3 py-2.5" : "px-3 py-2"}`}
            >
              {o.icon}
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 text-sm text-muted">
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none ${checked ? "bg-ink" : "bg-line"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-surface shadow transition-transform ${checked ? "translate-x-5" : ""}`}
        />
      </button>
    </label>
  );
}

interface Props {
  /** The filters to start editing from. */
  initial: Preferences;
  /** How many activities a set of filters would show, so the main button can say so. */
  countFor: (prefs: Preferences) => number;
  onApply: (prefs: Preferences) => void;
  onClose: () => void;
  /** Name of the starting point; the kilometre limit can only be used once one is set. */
  startName?: string;
}

/**
 * The filters as a modal dialog. Mount it to open it and unmount it to close it; changes are only
 * kept when "Prikaži … rezultata" is pressed.
 */
export default function FilterModal({ initial, countFor, onApply, onClose, startName }: Props) {
  const t = useT();
  const options = optionsFor(t);
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(initial);
  const count = countFor(draft);

  // showModal() gives the dimmed backdrop, traps focus inside and closes on Escape.
  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="filter-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // A click on the dialog element itself (not its content) is a click on the backdrop.
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="filter-modal m-auto max-h-[calc(100dvh-2rem)] w-[min(26rem,calc(100%-2rem))] overflow-y-auto rounded-3xl bg-surface p-0 text-ink shadow-2xl backdrop:bg-[#14305a]/30 backdrop:backdrop-blur-[2px]"
    >
      <form
        method="dialog"
        className="flex flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          onApply(draft);
        }}
      >
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 id="filter-title" className="font-serif text-2xl">
              {t.filters.title}
            </h2>
            <button
              type="button"
              onClick={() => setDraft(noFilters)}
              className="rounded-full border border-line px-4 py-2 text-sm font-medium transition hover:bg-page"
            >
              {t.filters.reset}
            </button>
          </div>

          <Segmented
            name="place"
            large
            options={options.place}
            value={draft.place}
            onChange={(place) => setDraft({ ...draft, place })}
          />
          <Segmented
            legend={t.filters.setting}
            name="setting"
            options={options.setting}
            value={draft.setting}
            onChange={(setting) => setDraft({ ...draft, setting })}
          />
          <Segmented
            legend={t.filters.distance}
            name="distance"
            options={options.distance}
            value={draft.distance}
            onChange={(distance) => setDraft({ ...draft, distance })}
          />
          {startName ? (
            <Segmented
              legend={t.filters.radius(startName)}
              name="radius"
              options={options.radius}
              value={draft.radius}
              onChange={(radius) => setDraft({ ...draft, radius })}
            />
          ) : (
            <p className="rounded-2xl bg-page px-4 py-3 text-sm text-muted">
              {t.filters.radiusHint}
            </p>
          )}
          <Segmented
            legend={t.filters.budget}
            name="budget"
            options={options.budget}
            value={draft.budget}
            onChange={(budget) => setDraft({ ...draft, budget })}
          />

          <div className="space-y-3">
            <h3 className="text-sm font-medium">{t.filters.more}</h3>
            <Toggle
              label={t.filters.coffee}
              checked={draft.coffee === "yes"}
              onChange={(on) => setDraft({ ...draft, coffee: on ? "yes" : "any" })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-line p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-line py-3 text-sm font-medium transition hover:bg-page"
          >
            {t.filters.cancel}
          </button>
          <button
            type="submit"
            className="rounded-full bg-ink py-3 text-sm font-medium text-surface transition hover:opacity-90 active:scale-[0.98]"
          >
            {t.filters.show(count)}
          </button>
        </div>
      </form>
    </dialog>
  );
}
