import { getDb } from "./db";

// Kept in sync with the event names InternshipApply.tsx sends via trackEvent().
export const EVENT_TYPES = ["apply_view", "form_started", "form_submitted"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export interface EventCounts {
  applyView: number;
  formStarted: number;
  formSubmitted: number;
}

export function recordEvent(type: EventType): void {
  const db = getDb();
  db.prepare("INSERT INTO analytics_events (type, created_at) VALUES (?, ?)").run(
    type,
    new Date().toISOString(),
  );
}

export function getEventCounts(): EventCounts {
  const db = getDb();
  const rows = db
    .prepare("SELECT type, COUNT(*) as count FROM analytics_events GROUP BY type")
    .all() as { type: string; count: number }[];

  const counts: EventCounts = { applyView: 0, formStarted: 0, formSubmitted: 0 };
  for (const row of rows) {
    if (row.type === "apply_view") counts.applyView = row.count;
    else if (row.type === "form_started") counts.formStarted = row.count;
    else if (row.type === "form_submitted") counts.formSubmitted = row.count;
  }
  return counts;
}
