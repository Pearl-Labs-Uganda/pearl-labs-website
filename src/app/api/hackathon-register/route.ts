import { NextResponse } from "next/server";
import { clientKey, createRateLimiter } from "@/lib/placement";
import { cleanFields, fieldErrors, readFields } from "@/lib/hackathon";
import { saveHackathonRegistration } from "@/lib/hackathonStore";
import { sendHackathonParentEmail, sendHackathonStaffEmail } from "@/lib/hackathonEmail";

export const runtime = "nodejs";

// A parent may register several children from one phone, so this is looser than internships.
const allow = createRateLimiter(15, 60 * 60 * 1000);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "We couldn't read the form — please try again." }, { status: 400 });

  // Bots fill the hidden field; tell them it worked and keep nothing.
  if (typeof body.website === "string" && body.website.trim()) return NextResponse.json({ ok: true });

  const ip = clientKey(request.headers.get("x-forwarded-for"), request.headers.get("x-real-ip"));
  if (!allow(ip)) {
    return NextResponse.json(
      { error: "Too many registrations from this connection — please try again later." },
      { status: 429 },
    );
  }

  const fields = cleanFields(readFields(body));
  const firstError = Object.values(fieldErrors(fields))[0];
  if (firstError) return NextResponse.json({ error: firstError }, { status: 400 });

  const sessionId =
    typeof body.sessionId === "string" && /^[A-Za-z0-9_-]{8,80}$/.test(body.sessionId) ? body.sessionId : null;

  let saved: { id: number; isNew: boolean } | null = null;
  try {
    saved = saveHackathonRegistration(fields, sessionId);
  } catch (error) {
    console.error("Hackathon registration NOT saved:", error);
  }

  // A resubmit of the same draft (retry, double-click) doesn't email again.
  if (saved && !saved.isNew) return NextResponse.json({ ok: true });

  let staffEmailed = false;
  try {
    await sendHackathonStaffEmail(fields, !!saved);
    staffEmailed = true;
  } catch (error) {
    console.error("Hackathon registration email to Pearl failed:", error);
  }

  if (!saved && !staffEmailed) {
    return NextResponse.json(
      { error: "We couldn't save the registration — please try again in a few minutes." },
      { status: 500 },
    );
  }

  try {
    await sendHackathonParentEmail(fields);
  } catch (error) {
    console.error("Hackathon 'received' email to the parent failed:", error);
  }

  return NextResponse.json({ ok: true });
}
