"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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

const placeOptions: Option<Preferences["place"]>[] = [
  { value: "any", label: "Svejedno", icon: anyIcon },
  { value: "nature", label: "Priroda", icon: natureIcon },
  { value: "city", label: "Grad", icon: cityIcon },
];
const settingOptions: Option<Preferences["setting"]>[] = [
  { value: "any", label: "Svejedno" },
  { value: "indoor", label: "Unutra" },
  { value: "outdoor", label: "Vani" },
];
const distanceOptions: Option<Preferences["distance"]>[] = [
  { value: "any", label: "Svejedno" },
  { value: "near", label: "Blizu" },
  { value: "far", label: "Daleko" },
];
const budgetOptions: Option<Preferences["budget"]>[] = [
  { value: "any", label: "Nebitno" },
  { value: "free", label: "Džabe" },
  { value: "moderate", label: "Umjereno" },
];

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
  return (
    <fieldset className="min-w-0">
      {legend ? (
        <legend className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">{legend}</legend>
      ) : (
        <legend className="sr-only">Priroda ili grad</legend>
      )}
      <div className="flex rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
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
              className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-full text-sm whitespace-nowrap text-zinc-400 transition peer-checked:bg-white peer-checked:font-medium peer-checked:text-zinc-900 peer-checked:shadow-[0_1px_4px_rgba(0,0,0,0.12)] peer-focus-visible:ring-2 peer-focus-visible:ring-zinc-900 hover:text-zinc-700 dark:text-zinc-500 dark:peer-checked:bg-zinc-950 dark:peer-checked:text-white ${large ? "px-3 py-2.5" : "px-3 py-2"}`}
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
    <label className="flex cursor-pointer items-center justify-between gap-4 text-sm text-zinc-500 dark:text-zinc-400">
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:outline-none ${checked ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-200 dark:bg-zinc-700"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform dark:bg-zinc-900 ${checked ? "translate-x-5" : ""}`}
        />
      </button>
    </label>
  );
}

/** "Prikaži 1 rezultat", "Prikaži 3 rezultata", "Prikaži 5 rezultata". */
function showResultsText(count: number): string {
  return count % 10 === 1 && count % 100 !== 11 ? `Prikaži ${count} rezultat` : `Prikaži ${count} rezultata`;
}

interface Props {
  /** The filters to start editing from. */
  initial: Preferences;
  /** How many activities a set of filters would show, so the main button can say so. */
  countFor: (prefs: Preferences) => number;
  onApply: (prefs: Preferences) => void;
  onClose: () => void;
}

/**
 * The filters as a modal dialog. Mount it to open it and unmount it to close it; changes are only
 * kept when "Prikaži … rezultata" is pressed.
 */
export default function FilterModal({ initial, countFor, onApply, onClose }: Props) {
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
      className="filter-modal m-auto max-h-[calc(100dvh-2rem)] w-[min(26rem,calc(100%-2rem))] overflow-y-auto rounded-3xl bg-white p-0 text-zinc-900 shadow-2xl backdrop:bg-zinc-900/30 backdrop:backdrop-blur-[2px] dark:bg-zinc-900 dark:text-zinc-100"
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
            <h2 id="filter-title" className="text-xl font-semibold tracking-tight">
              Filteri
            </h2>
            <button
              type="button"
              onClick={() => setDraft(noFilters)}
              className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Poništi filtere
            </button>
          </div>

          <Segmented
            name="place"
            large
            options={placeOptions}
            value={draft.place}
            onChange={(place) => setDraft({ ...draft, place })}
          />
          <Segmented
            legend="Unutra ili vani"
            name="setting"
            options={settingOptions}
            value={draft.setting}
            onChange={(setting) => setDraft({ ...draft, setting })}
          />
          <Segmented
            legend="Daljina"
            name="distance"
            options={distanceOptions}
            value={draft.distance}
            onChange={(distance) => setDraft({ ...draft, distance })}
          />
          <Segmented
            legend="Budžet"
            name="budget"
            options={budgetOptions}
            value={draft.budget}
            onChange={(budget) => setDraft({ ...draft, budget })}
          />

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Više opcija</h3>
            <Toggle
              label="Kafa za roditelje"
              checked={draft.coffee === "yes"}
              onChange={(on) => setDraft({ ...draft, coffee: on ? "yes" : "any" })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-zinc-100 p-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 py-3 text-sm font-medium transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Odustani
          </button>
          <button
            type="submit"
            className="rounded-xl bg-zinc-950 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 active:scale-[0.98] dark:bg-white dark:text-zinc-950"
          >
            {showResultsText(count)}
          </button>
        </div>
      </form>
    </dialog>
  );
}
