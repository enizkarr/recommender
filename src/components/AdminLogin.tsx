"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/lib/adminActions";

// The admin page is for the site's owner only, so its texts are in Bosnian alone.
const messages: Record<NonNullable<LoginState["error"]>, string> = {
  wrong: "Pogrešna lozinka.",
  blocked: "Previše pogrešnih pokušaja. Pokušajte ponovo za 15 minuta.",
  notConfigured: "Admin lozinka nije postavljena (ADMIN_PASSWORD u .env.local).",
};

export default function AdminLogin() {
  const [state, formAction, pending] = useActionState(login, { error: null });
  return (
    <form action={formAction} className="max-w-sm space-y-4 rounded-[30px] bg-surface p-6 shadow-card">
      <div>
        <label htmlFor="admin-password" className="mb-1.5 block text-sm font-medium">
          Lozinka
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          autoFocus
          className="w-full rounded-2xl border border-line bg-page px-4 py-2.5 focus:border-accent focus:outline-none"
        />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
          {messages[state.error]}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-surface transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Provjeravam…" : "Prijava"}
      </button>
    </form>
  );
}
