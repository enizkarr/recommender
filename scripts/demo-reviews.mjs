// Fills the site with made-up approved reviews, to see features like the ranking with some data.
//   npm run db:demo                adds them: 15 random activities, ratings from 3 to 5 stars
//   npm run db:demo -- --remove    removes them again, leaving real reviews alone
// They are labelled as demo data on the site and marked in the database, so never leave them on a live site.
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";

// db.ts starts with `import "server-only"`, a marker that only exists inside Next.js.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") return { url: "data:text/javascript,", shortCircuit: true };
    return next(specifier, context);
  },
});

const MARKER = "demo-seed";
const ACTIVITIES = 15;
/** How many of them get enough reviews for a rank. */
const WELL_REVIEWED = 6;

const { getDb } = await import(pathToFileURL("src/lib/db.ts").href);
const { activities } = await import(pathToFileURL("src/data/activities.ts").href);
const db = getDb();

if (process.argv.includes("--remove")) {
  const { changes } = db.prepare("DELETE FROM reviews WHERE sender_hash = ?").run(MARKER);
  console.log(`Removed ${changes} demo reviews.`);
  process.exit(0);
}

const { n: existing } = db.prepare("SELECT count(*) AS n FROM reviews WHERE sender_hash = ?").get(MARKER);
if (existing > 0) {
  console.log(`There are already ${existing} demo reviews. Remove them first with: npm run db:demo -- --remove`);
  process.exit(1);
}

const between = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const picked = activities
  .map((a) => ({ id: a.id, order: Math.random() }))
  .sort((a, b) => a.order - b.order)
  .slice(0, ACTIVITIES);

const insert = db.prepare(
  `INSERT INTO reviews (activity_id, rating, text, author, status, reviewed_at, sender_hash)
   VALUES (?, ?, 'Probna recenzija (demo podaci).', 'Demo', 'approved', strftime('%Y-%m-%dT%H:%M:%SZ', 'now'), ?)`,
);
const summary = [];
db.exec("BEGIN");
picked.forEach(({ id }, i) => {
  const count = i < WELL_REVIEWED ? between(3, 6) : between(1, 2);
  const ratings = Array.from({ length: count }, () => between(3, 5));
  for (const rating of ratings) insert.run(id, rating, MARKER);
  summary.push({ activity: id, reviews: count, ratings: ratings.join(" ") });
});
db.exec("COMMIT");
console.table(summary);
