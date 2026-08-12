import { NextResponse } from "next/server";
import { EVENT_TYPES, recordEvent, type EventType } from "@/lib/analyticsEvents";

function isEventType(value: unknown): value is EventType {
  return typeof value === "string" && (EVENT_TYPES as readonly string[]).includes(value);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { type?: unknown } | null;

  if (!isEventType(body?.type)) {
    return NextResponse.json({ error: "Unknown event type" }, { status: 400 });
  }

  recordEvent(body.type);
  return NextResponse.json({ ok: true });
}
