import { getDb } from "./db";

// Staff can declare the bootcamp full independently of the real reserved-spot
// count — the dashboard's capacity bar keeps reading actual registrations,
// this is just a manual override that closes the public form early (or keeps
// it open past 30 if staff decide to squeeze in extra spots).
const FULL_KEY = "registration_full";
const MESSAGE_KEY = "registration_full_message";

export const DEFAULT_REGISTRATION_FULL_MESSAGE =
  "Registration is currently full. Email us at pearllabsug@gmail.com if you'd like to be added to a waitlist.";

export interface RegistrationCapacityStatus {
  full: boolean;
  message: string;
}

export function getRegistrationCapacityStatus(): RegistrationCapacityStatus {
  const db = getDb();
  const rows = db
    .prepare(`SELECT key, value FROM app_settings WHERE key IN ('${FULL_KEY}', '${MESSAGE_KEY}')`)
    .all() as { key: string; value: string }[];
  const map = new Map(rows.map((r) => [r.key, r.value]));

  return {
    full: map.get(FULL_KEY) === "1",
    message: map.get(MESSAGE_KEY)?.trim() || DEFAULT_REGISTRATION_FULL_MESSAGE,
  };
}

export function setRegistrationFull(full: boolean, message: string): void {
  const db = getDb();
  const upsert = db.prepare(
    `INSERT INTO app_settings (key, value) VALUES (@key, @value)
     ON CONFLICT(key) DO UPDATE SET value = @value`,
  );
  upsert.run({ key: FULL_KEY, value: full ? "1" : "0" });
  upsert.run({ key: MESSAGE_KEY, value: message.trim() || DEFAULT_REGISTRATION_FULL_MESSAGE });
}
