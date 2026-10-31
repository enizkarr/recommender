import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

// The site's database: one SQLite file on the machine that runs the site, using the SQLite built
// into Node. It is ignored by git, so visitors' reviews never end up on GitHub; back the file up instead.
// REVIEWS_DB_PATH can point it elsewhere, e.g. to a folder that is backed up automatically.
const DB_PATH = process.env.REVIEWS_DB_PATH ?? path.join(process.cwd(), "data", "family-time.db");

/**
 * Schema changes, applied in order. The database remembers how many it has applied
 * (PRAGMA user_version), so a new change is added at the end and never by editing an old one.
 */
const migrations: string[] = [
  // 1: reviews. Every review starts as "pending" and only shows on the site once approved.
  `CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    text TEXT NOT NULL CHECK (length(text) BETWEEN 1 AND 300),
    -- A first name or nickname; there are no accounts.
    author TEXT CHECK (author IS NULL OR length(author) <= 40),
    -- Free text such as "4 i 7", so parents can see reviews from families with children of a similar age.
    kids_ages TEXT CHECK (kids_ages IS NULL OR length(kids_ages) <= 40),
    -- "2026-10": when they went, since a summer visit says little about winter.
    visit_month TEXT CHECK (visit_month IS NULL OR visit_month GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]'),
    lang TEXT NOT NULL DEFAULT 'bs' CHECK (lang IN ('bs', 'en')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    reviewed_at TEXT,
    -- A one-way hash of the visitor's connection, only for limiting how many reviews one sender can post;
    -- the IP address itself is never stored.
    sender_hash TEXT
  );
  -- Approved reviews of one activity, newest first: what the cards and the popup read.
  CREATE INDEX reviews_by_activity ON reviews (activity_id, status, created_at);
  -- The admin page's queue of reviews waiting for approval.
  CREATE INDEX reviews_by_status ON reviews (status, created_at);
  -- Recent reviews from one sender, for the spam limit.
  CREATE INDEX reviews_by_sender ON reviews (sender_hash, created_at);`,
];

function open(): DatabaseSync {
  mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  // WAL lets visitors keep reading while a review is being written; busy_timeout waits briefly
  // instead of failing when two writes arrive at the same moment.
  db.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;");

  const { user_version: applied } = db.prepare("PRAGMA user_version").get() as { user_version: number };
  for (let i = applied; i < migrations.length; i++) {
    db.exec("BEGIN");
    try {
      db.exec(migrations[i]);
      db.exec(`PRAGMA user_version = ${i + 1}`);
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  }
  return db;
}

// One connection for the whole server. In development, Next reloads modules on every change,
// so the connection is kept on globalThis to avoid opening a new one each time.
const globalForDb = globalThis as unknown as { familyTimeDb?: DatabaseSync };

/** The open database, created and brought up to date on first use. Server-only. */
export function getDb(): DatabaseSync {
  globalForDb.familyTimeDb ??= open();
  return globalForDb.familyTimeDb;
}
