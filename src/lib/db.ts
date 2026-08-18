import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

let instance: Database.Database | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  profession TEXT NOT NULL,
  phone TEXT NOT NULL,
  alt_phone TEXT,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  student_name TEXT NOT NULL,
  age TEXT NOT NULL,
  gender TEXT NOT NULL,
  school TEXT NOT NULL,
  class_grade TEXT NOT NULL,
  cohort TEXT NOT NULL,
  has_laptop TEXT NOT NULL,
  modules TEXT NOT NULL,
  amount_due INTEGER NOT NULL,
  hear_about TEXT NOT NULL,
  hear_about_other TEXT,
  pickup_service TEXT NOT NULL,
  pickup_location TEXT,
  medical_info TEXT,
  additional_info TEXT,
  agree_terms INTEGER NOT NULL,
  photo_consent TEXT NOT NULL,
  transaction_id TEXT,
  verified INTEGER NOT NULL DEFAULT 0,
  verified_at TEXT
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS incomplete_registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  parent_name TEXT,
  student_name TEXT,
  email TEXT,
  modules TEXT,
  amount_due INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  submitted INTEGER NOT NULL DEFAULT 0
);
`;

// Columns added after incomplete_registrations already existed in production —
// CREATE TABLE IF NOT EXISTS won't retrofit these, so add any that are missing.
const INCOMPLETE_LEAD_MIGRATION_COLUMNS: Record<string, string> = {
  relationship: "TEXT",
  profession: "TEXT",
  alt_phone: "TEXT",
  address: "TEXT",
  age: "TEXT",
  gender: "TEXT",
  school: "TEXT",
  class_grade: "TEXT",
  cohort: "TEXT",
  has_laptop: "TEXT",
  hear_about: "TEXT",
  hear_about_other: "TEXT",
  transaction_id: "TEXT",
  pickup_service: "TEXT",
  pickup_location: "TEXT",
  medical_info: "TEXT",
  additional_info: "TEXT",
  agree_terms: "INTEGER",
  photo_consent: "TEXT",
  dismissed: "INTEGER NOT NULL DEFAULT 0",
  contacted: "INTEGER NOT NULL DEFAULT 0",
  resume_token: "TEXT",
  resume_token_expires_at: "TEXT",
};

// Payment method wasn't captured before — parents just had MoMo instructions
// with an informational "or pay cash" note, so there was no way to tell
// whether someone chose cash or simply hadn't paid yet with MoMo.
const REGISTRATIONS_MIGRATION_COLUMNS: Record<string, string> = {
  payment_method: "TEXT NOT NULL DEFAULT ''",
  // The client already generates a stable per-draft sessionId for incomplete-
  // lead tracking; reusing it here lets a resubmit (retry after a dropped
  // response, double-click, etc.) update the same row instead of inserting
  // a duplicate registration for the same family.
  session_id: "TEXT",
};

function migrateColumns(
  db: Database.Database,
  table: string,
  columns: Record<string, string>,
): void {
  const existingColumns = new Set(
    (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((c) => c.name),
  );
  for (const [column, type] of Object.entries(columns)) {
    if (!existingColumns.has(column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
    }
  }
}

export function getDb(): Database.Database {
  if (instance) return instance;

  const dbPath = process.env.REGISTRATIONS_DB_PATH ?? path.join(process.cwd(), "data", "registrations.db");

  if (dbPath !== ":memory:") {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  instance = new Database(dbPath);
  instance.pragma("journal_mode = WAL");
  instance.exec(SCHEMA);
  migrateColumns(instance, "incomplete_registrations", INCOMPLETE_LEAD_MIGRATION_COLUMNS);
  migrateColumns(instance, "registrations", REGISTRATIONS_MIGRATION_COLUMNS);
  return instance;
}

export function resetDbForTests(): void {
  if (instance) {
    instance.close();
  }
  instance = null;
}
