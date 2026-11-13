import { NextResponse } from "next/server";
import { preflight, withCors } from "@/lib/cors";
import { EVENT_TYPES, recordEvent, type EventType } from "@/lib/analyticsEvents";

function isEventType(value: unknown): value is EventType {
  return typeof value === "string" && (EVENT_TYPES as readonly string[]).includes(value);
}

async function handle(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => null)) as { type?: unknown; visitorId?: unknown } | null;

  if (!isEventType(body?.type)) {
    return NextResponse.json({ error: "Unknown event type" }, { status: 400 });
  }

  const visitorId =
    typeof body.visitorId === "string" && /^[A-Za-z0-9_-]{8,64}$/.test(body.visitorId) ? body.visitorId : null;
  recordEvent(body.type, visitorId);
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  return withCors(request, await handle(request));
}

export function OPTIONS(request: Request) {
  return preflight(request);
}
