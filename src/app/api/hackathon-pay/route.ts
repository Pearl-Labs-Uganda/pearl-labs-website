import { NextResponse } from "next/server";
import { preflight, withCors } from "@/lib/cors";
import { clientKey, createRateLimiter } from "@/lib/placement";
import { isMomoTransactionId } from "@/lib/hackathon";
import { isPayToken, setTransactionIdByPayToken } from "@/lib/hackathonStore";
import { sendHackathonIdAddedEmail } from "@/lib/hackathonEmail";

export const runtime = "nodejs";

const allow = createRateLimiter(20, 60 * 60 * 1000);

// A family adds (or corrects) their MoMo transaction ID through their own pay link.
async function handle(request: Request): Promise<Response> {
  const ip = clientKey(request.headers.get("x-forwarded-for"), request.headers.get("x-real-ip"));
  if (!allow(ip)) return NextResponse.json({ error: "Too many tries — please wait a while." }, { status: 429 });

  const body = (await request.json().catch(() => null)) as { token?: unknown; transactionId?: unknown } | null;
  const token = typeof body?.token === "string" ? body.token : "";
  const transactionId = typeof body?.transactionId === "string" ? body.transactionId.replace(/\s+/g, "") : "";
  if (!isPayToken(token)) return NextResponse.json({ error: "This link isn't valid." }, { status: 404 });
  if (!isMomoTransactionId(transactionId)) {
    return NextResponse.json(
      { error: "That doesn't look like a MoMo transaction ID — check the confirmation SMS." },
      { status: 400 },
    );
  }

  const row = setTransactionIdByPayToken(token, transactionId);
  if (!row) {
    return NextResponse.json({ error: "This payment is already confirmed, so it can't be changed here." }, { status: 409 });
  }
  try {
    await sendHackathonIdAddedEmail(row);
  } catch (error) {
    console.error("Hackathon 'MoMo ID added' email to Pearl failed:", error);
  }
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  return withCors(request, await handle(request));
}

export function OPTIONS(request: Request) {
  return preflight(request);
}
