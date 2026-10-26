"use client";

import { useState } from "react";
import { activities } from "@/data/activities";
import { recommend } from "@/lib/recommend";
import type { Budget, Preferences, Setting } from "@/lib/types";

const field =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

export default function Recommender() {
  const [prefs, setPrefs] = useState<Preferences>({
    childAge: 6,
    setting: "either",
    budget: "low",
    hours: 3,
  });
  const results = recommend(activities, prefs);

  return (
    <div className="grid gap-8 md:grid-cols-[18rem_1fr]">
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <label className="block text-sm font-medium">
          Youngest child&apos;s age
          <input
            type="number"
            min={0}
            max={17}
            className={field}
            value={prefs.childAge}
            onChange={(e) => setPrefs({ ...prefs, childAge: Number(e.target.value) })}
          />
        </label>
        <label className="block text-sm font-medium">
          Indoors or outdoors
          <select
            className={field}
            value={prefs.setting}
            onChange={(e) => setPrefs({ ...prefs, setting: e.target.value as Setting })}
          >
            <option value="either">Either</option>
            <option value="indoor">Indoors</option>
            <option value="outdoor">Outdoors</option>
          </select>
        </label>
        <label className="block text-sm font-medium">
          Budget
          <select
            className={field}
            value={prefs.budget}
            onChange={(e) => setPrefs({ ...prefs, budget: e.target.value as Budget })}
          >
            <option value="free">Free</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">Anything goes</option>
          </select>
        </label>
        <label className="block text-sm font-medium">
          Time available (hours)
          <input
            type="number"
            min={1}
            max={12}
            className={field}
            value={prefs.hours}
            onChange={(e) => setPrefs({ ...prefs, hours: Number(e.target.value) })}
          />
        </label>
      </form>

      <section aria-live="polite" className="space-y-4">
        {results.length === 0 && (
          <p className="text-zinc-600 dark:text-zinc-400">
            No matches yet. Try a bigger budget or more time.
          </p>
        )}
        {results.map((a) => (
          <article
            key={a.id}
            className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <h3 className="text-lg font-semibold">{a.title}</h3>
            <p className="mt-1 text-zinc-700 dark:text-zinc-300">{a.description}</p>
            <p className="mt-2 text-sm text-zinc-500">
              {a.setting} · {a.budget} cost · about {a.durationHours}h · ages {a.minAge}+
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
