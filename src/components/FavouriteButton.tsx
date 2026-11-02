"use client";

import { useT } from "@/i18n/LangProvider";
import { toggleFavourite, useFavourites } from "@/lib/favourites";

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`size-[18px] shrink-0 ${filled ? "text-[#e25b5b]" : ""}`}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20.5S3 15 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 11.5-9 11.5z" />
    </svg>
  );
}

/** Saves an activity to the favourites or removes it: a round heart, or with `label`, a heart with text. */
export default function FavouriteButton({ id, title, className = "", label = false }: { id: string; title: string; className?: string; label?: boolean }) {
  const t = useT();
  const saved = useFavourites().includes(id);
  if (label) {
    return (
      <button type="button" onClick={() => toggleFavourite(id)} className={className}>
        <Heart filled={saved} />
        {saved ? t.favourites.saved : t.favourites.save}
      </button>
    );
  }
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={t.favourites.toggle(title)}
      onClick={() => toggleFavourite(id)}
      className={`grid size-[38px] place-items-center rounded-full bg-white/90 text-[#14305a] shadow-soft backdrop-blur transition hover:scale-110 hover:bg-white ${className}`}
    >
      <Heart filled={saved} />
    </button>
  );
}
