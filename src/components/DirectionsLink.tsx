"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Remembered in the browser once someone ticks "Ne prikazuj više".
const STORAGE_KEY = "family-time:route-warning-off";

function warningTurnedOff(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function turnWarningOff() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Storage blocked: the warning simply shows again next time.
  }
}

/** Reminder that the suggested route is only a guide, shown before Google Maps opens. */
function RouteWarning({ href, onClose }: { href: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [dontShow, setDontShow] = useState(false);

  // showModal() gives the dimmed backdrop, traps focus inside and closes on Escape.
  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="route-warning-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // A click on the dialog element itself (not its content) is a click on the backdrop.
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="route-warning m-auto w-[min(26rem,calc(100%-2rem))] rounded-3xl bg-surface p-0 text-left text-base font-normal text-ink shadow-2xl backdrop:bg-[#14305a]/30 backdrop:backdrop-blur-[2px]"
    >
      <div className="space-y-4 p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sun text-xl" aria-hidden>
            ⚠️
          </span>
          <h2 id="route-warning-title" className="font-serif text-2xl">
            Prije nego krenete
          </h2>
        </div>
        <p className="text-sm text-muted">
          Ruta je samo okvirna. Navigacija ne zna uvijek za radove na cesti, zatvorene ili makadamske puteve i zimske uslove,
          posebno u planinama.
        </p>
        <p className="text-sm text-muted">
          Pratite saobraćajne znakove, prije puta provjerite stanje na cestama (npr. na{" "}
          <a href="https://www.bihamk.ba" target="_blank" rel="noopener noreferrer" className="font-medium text-accent underline-offset-2 hover:underline">
            bihamk.ba
          </a>
          ) i ne oslanjajte se samo na navigaciju.
        </p>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input type="checkbox" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} className="size-4 accent-[var(--accent)]" />
          Ne prikazuj više
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3 border-t border-line p-4">
        <button type="button" onClick={onClose} className="rounded-full border border-line py-3 text-sm font-medium transition hover:bg-page">
          Odustani
        </button>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            if (dontShow) turnWarningOff();
            onClose();
          }}
          className="rounded-full bg-ink py-3 text-center text-sm font-medium text-surface transition hover:opacity-90"
        >
          Otvori Google Maps
        </a>
      </div>
    </dialog>
  );
}

/**
 * Link to driving directions. The first time (until "Ne prikazuj više" is ticked) it shows a
 * reminder that the route is only a guide; the link itself then opens Google Maps.
 */
export default function DirectionsLink({ href, label, className, children }: { href: string; label: string; className: string; children: ReactNode }) {
  const [warning, setWarning] = useState(false);
  return (
    <>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        onClick={(e) => {
          if (warningTurnedOff()) return;
          e.preventDefault();
          setWarning(true);
        }}
        className={className}
      >
        {children}
      </a>
      {warning && <RouteWarning href={href} onClose={() => setWarning(false)} />}
    </>
  );
}
