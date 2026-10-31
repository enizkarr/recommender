import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import AdminLogin from "@/components/AdminLogin";
import { activities } from "@/data/activities";
import { decideReview, logout, removeReview } from "@/lib/adminActions";
import { adminConfigured, isAdmin, MIN_PASSWORD_LENGTH } from "@/lib/adminAuth";
import { isReviewStatus, listReviews, reviewCounts, type ReviewStatus, type StoredReview } from "@/lib/reviews";

// The owner's page for approving reviews, at /admin. It is in Bosnian only and kept out of search engines.

export const metadata: Metadata = {
  title: "Admin – Family Time",
  robots: { index: false, follow: false },
};

const titles = new Map(activities.map((a) => [a.id, a.title]));

const tabs: { status: ReviewStatus; label: string }[] = [
  { status: "pending", label: "Na čekanju" },
  { status: "approved", label: "Odobrene" },
  { status: "rejected", label: "Odbijene" },
];

const dateTime = new Intl.DateTimeFormat("bs-BA", { timeZone: "Europe/Sarajevo", dateStyle: "medium", timeStyle: "short" });

const button = "rounded-full px-4 py-2 text-sm font-medium transition";

function ReviewCard({ r }: { r: StoredReview }) {
  const details = [r.author, r.kidsAges && `djeca: ${r.kidsAges}`, r.visitMonth && `posjeta: ${r.visitMonth}`, r.lang === "en" && "na engleskom"].filter(Boolean);
  return (
    <li className="rounded-3xl bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-serif text-xl">{titles.get(r.activityId) ?? r.activityId}</h3>
        <span className="text-sm text-muted">
          #{r.id} · {dateTime.format(new Date(r.createdAt))}
        </span>
      </div>
      <p className="mt-1 text-lg tracking-wide text-sun" aria-label={`${r.rating} od 5`}>
        {"★".repeat(r.rating)}
        <span className="text-line">{"★".repeat(5 - r.rating)}</span>
      </p>
      <p className="mt-2 leading-relaxed whitespace-pre-line">{r.text}</p>
      {details.length > 0 && <p className="mt-2 text-sm text-muted">{details.join(" · ")}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {/* The clicked button's name and value go with the form, so one form serves every choice. */}
        <form action={decideReview} className="flex flex-wrap gap-2">
          <input type="hidden" name="id" value={r.id} />
          {r.status !== "approved" && (
            <button name="status" value="approved" className={`${button} bg-emerald-600 text-white hover:bg-emerald-700`}>
              Odobri
            </button>
          )}
          {r.status !== "rejected" && (
            <button name="status" value="rejected" className={`${button} border border-line hover:bg-page`}>
              Odbij
            </button>
          )}
          {r.status !== "pending" && (
            <button name="status" value="pending" className={`${button} border border-line hover:bg-page`}>
              Vrati na čekanje
            </button>
          )}
        </form>
        {r.status === "rejected" && (
          <form action={removeReview}>
            <input type="hidden" name="id" value={r.id} />
            <button className={`${button} text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950`}>Obriši zauvijek</button>
          </form>
        )}
      </div>
    </li>
  );
}

/** Everything that depends on the login cookie, so it has to wait for the request (hence the Suspense below). */
async function AdminContent({ searchParams }: { searchParams: PageProps<"/[lang]/admin">["searchParams"] }) {
  // Wait for a real request before anything else: otherwise the password check and the database
  // read would run once during the build, and their result would be saved as a fixed page.
  await connection();
  if (!adminConfigured()) {
    return (
      <div className="max-w-xl space-y-3 rounded-[30px] bg-surface p-6 shadow-card">
        <p className="font-medium">Admin stranica je isključena dok se ne postavi lozinka.</p>
        <p className="text-muted">
          U glavnom folderu projekta napravite datoteku <code>.env.local</code> s redom <code>ADMIN_PASSWORD=vaša-lozinka</code> (najmanje{" "}
          {MIN_PASSWORD_LENGTH} znakova), pa ponovo pokrenite stranicu.
        </p>
      </div>
    );
  }
  if (!(await isAdmin())) return <AdminLogin />;

  const { status } = await searchParams;
  const current: ReviewStatus = isReviewStatus(status) ? status : "pending";
  const counts = reviewCounts();
  const reviews = listReviews(current);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Status recenzija" className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.status}
              href={tab.status === "pending" ? "/admin" : `/admin?status=${tab.status}`}
              aria-current={tab.status === current ? "page" : undefined}
              className={`${button} ${tab.status === current ? "bg-ink text-surface" : "bg-surface shadow-card hover:bg-page"}`}
            >
              {tab.label} ({counts[tab.status]})
            </Link>
          ))}
        </nav>
        <form action={logout}>
          <button className={`${button} text-muted hover:bg-surface`}>Odjava</button>
        </form>
      </div>

      {reviews.length === 0 ? (
        <p className="text-muted">{current === "pending" ? "Nema recenzija na čekanju. 🎉" : "Ovdje još nema recenzija."}</p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <ReviewCard key={r.id} r={r} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function AdminPage({ params, searchParams }: PageProps<"/[lang]/admin">) {
  const { lang } = await params;
  if (lang !== "bs") notFound();
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <h1 className="mb-6 font-serif text-[clamp(28px,4vw,40px)]">Recenzije – admin</h1>
      <Suspense fallback={<p className="text-muted">Učitavam…</p>}>
        <AdminContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
