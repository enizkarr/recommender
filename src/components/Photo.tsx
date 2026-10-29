import Image from "next/image";
import type { Activity } from "@/lib/types";

/** Photo of an activity, or a soft placeholder for the ones without a picture yet. */
export default function Photo({ a, sizes, className = "", eager = false }: { a: Activity; sizes: string; className?: string; eager?: boolean }) {
  return a.image ? (
    <Image src={a.image} alt={a.title} fill sizes={sizes} loading={eager ? "eager" : undefined} className={`object-cover ${className}`} />
  ) : (
    <span
      className={`absolute inset-0 grid place-items-center bg-[linear-gradient(140deg,color-mix(in_srgb,var(--soft)_45%,var(--surface)),var(--surface))] text-4xl ${className}`}
      aria-hidden
    >
      {a.place === "nature" ? "🌲" : "🏛️"}
    </span>
  );
}
