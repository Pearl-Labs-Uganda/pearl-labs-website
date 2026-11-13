import { NextResponse } from "next/server";
import { clientKey, createRateLimiter } from "@/lib/placement";
import { leadFields, leadPhoneReady, type Step } from "@/lib/hackathon";
import { saveHackathonLead } from "@/lib/hackathonStore";

export const runtime = "nodejs";

// The form saves a draft ~1s after typing stops, so allow plenty per connection.
const allow = createRateLimiter(300, 60 * 60 * 1000);

// Saves an unfinished form as soon as the parent's phone has 10 digits, so staff can follow up
// with anyone who stops on the way. Never fails loudly: the family shouldn't notice it.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || (typeof body.website === "string" && body.website.trim())) return NextResponse.json({ ok: true });

  const ip = clientKey(request.headers.get("x-forwarded-for"), request.headers.get("x-real-ip"));
  if (!allow(ip)) return NextResponse.json({ ok: false }, { status: 429 });

  const sessionId = typeof body.sessionId === "string" && /^[A-Za-z0-9_-]{8,80}$/.test(body.sessionId) ? body.sessionId : null;
  const fields = leadFields(body);
  if (!sessionId || !leadPhoneReady(fields.parentPhone)) return NextResponse.json({ ok: false }, { status: 400 });
  const step: Step = body.step === 1 || body.step === 2 ? body.step : 0;

  try {
    saveHackathonLead(sessionId, fields, step);
  } catch (error) {
    console.error("Hackathon lead not saved:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
