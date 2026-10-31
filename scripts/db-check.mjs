// Opens the site's database (creating it if needed) and prints what is in it.
//   npm run db:check                 summary: schema version, columns, reviews per status
//   npm run db:check -- --sample     also adds a made-up review, marked as pending
//   npm run db:check -- --list       also lists the latest 10 reviews
// It uses the same code as the site (src/lib/db.ts), so it checks exactly what the site will use.
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";

// db.ts starts with `import "server-only"`, a marker that only exists inside Next.js.
// Outside Next it is replaced with an empty module, so the file can be loaded here too.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") return { url: "data:text/javascript,", shortCircuit: true };
    return next(specifier, context);
  },
});

const { getDb } = await import(pathToFileURL("src/lib/db.ts").href);
const db = getDb();
const args = process.argv.slice(2);

console.log(`Database: ${process.env.REVIEWS_DB_PATH ?? "data/family-time.db"}`);
console.log(`Schema version: ${db.prepare("PRAGMA user_version").get().user_version}`);
console.log(`Columns: ${db.prepare("PRAGMA table_info(reviews)").all().map((c) => c.name).join(", ")}`);

if (args.includes("--sample")) {
  const { lastInsertRowid } = db
    .prepare("INSERT INTO reviews (activity_id, rating, text, author, kids_ages, visit_month) VALUES (?, ?, ?, ?, ?, ?)")
    .run("vrelo-bosne", 5, "Probna recenzija – ponesite hljeb za labudove.", "Test", "4 i 7", "2026-10");
  console.log(`Added sample review #${lastInsertRowid} (pending).`);
}

const counts = db.prepare("SELECT status, count(*) AS n FROM reviews GROUP BY status").all();
console.log(`Reviews: ${counts.length ? counts.map((c) => `${c.status} ${c.n}`).join(", ") : "none yet"}`);

if (args.includes("--list")) {
  console.table(db.prepare("SELECT id, activity_id, rating, status, author, text, created_at FROM reviews ORDER BY id DESC LIMIT 10").all());
}
