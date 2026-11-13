import { getDb } from "./db";

// Kept in sync with the event names the forms send via trackEvent().
export const EVENT_TYPES = [
  "apply_view",
  "form_started",
  "form_submitted",
  "momo_code_copied",
  // /internships (InternshipPlacement.tsx)
  "internship_view",
  "internship_started",
  "internship_submitted",
  // /hackathon (HackathonRegister.tsx)
  "hackathon_view",
  "hackathon_started",
  "hackathon_parent_done",
  "hackathon_child_done",
  "hackathon_momo_copied",
  "hackathon_submitted",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export interface EventCounts {
  applyView: number;
  formStarted: number;
  formSubmitted: number;
  momoCodeCopied: number;
}

export function recordEvent(type: EventType, visitorId: string | null = null): void {
  const db = getDb();
  db.prepare("INSERT INTO analytics_events (type, created_at, visitor_id) VALUES (?, ?, ?)").run(
    type,
    new Date().toISOString(),
    visitorId,
  );
}

export interface FunnelStep {
  type: EventType;
  total: number;
  unique: number; // distinct browsers; events from before visitor ids existed don't count here
}

// Per event: how many times it fired and how many different browsers fired it.
export function getFunnel(types: readonly EventType[]): FunnelStep[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT type, COUNT(*) AS total, COUNT(DISTINCT visitor_id) AS uniq
       FROM analytics_events WHERE type IN (${types.map(() => "?").join(",")}) GROUP BY type`,
    )
    .all(...types) as { type: string; total: number; uniq: number }[];
  return types.map((type) => {
    const r = rows.find((x) => x.type === type);
    return { type, total: r?.total ?? 0, unique: r?.uniq ?? 0 };
  });
}

export function getEventCounts(): EventCounts {
  const db = getDb();
  const rows = db
    .prepare("SELECT type, COUNT(*) as count FROM analytics_events GROUP BY type")
    .all() as { type: string; count: number }[];

  const counts: EventCounts = {
    applyView: 0,
    formStarted: 0,
    formSubmitted: 0,
    momoCodeCopied: 0,
  };
  for (const row of rows) {
    if (row.type === "apply_view") counts.applyView = row.count;
    else if (row.type === "form_started") counts.formStarted = row.count;
    else if (row.type === "form_submitted") counts.formSubmitted = row.count;
    else if (row.type === "momo_code_copied") counts.momoCodeCopied = row.count;
  }
  return counts;
}
