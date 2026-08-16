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

export function getDb(): Database.Database {
  if (instance) return instance;

  const dbPath = process.env.REGISTRATIONS_DB_PATH ?? path.join(process.cwd(), "data", "registrations.db");

  if (dbPath !== ":memory:") {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  instance = new Database(dbPath);
  instance.pragma("journal_mode = WAL");
  instance.exec(SCHEMA);
  return instance;
}

export function resetDbForTests(): void {
  if (instance) {
    instance.close();
  }
  instance = null;
}
