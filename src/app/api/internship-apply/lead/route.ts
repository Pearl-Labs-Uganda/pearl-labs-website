import { NextResponse } from "next/server";
import { saveIncompleteLead, type IncompleteLeadInput } from "@/lib/leads";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | Partial<IncompleteLeadInput>
      | null;

    if (!body || typeof body.sessionId !== "string" || !body.sessionId.trim()) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    if (typeof body.phone !== "string" || !body.phone.trim()) {
      return NextResponse.json({ error: "Missing phone number" }, { status: 400 });
    }

    const lead = saveIncompleteLead({
      ...body,
      sessionId: body.sessionId,
      phone: body.phone,
      modules: Array.isArray(body.modules) ? body.modules : [],
    });

    return NextResponse.json({ ok: true, id: lead.id });
  } catch (error) {
    console.error("Failed to save incomplete lead:", error);
    return NextResponse.json(
      { error: "Failed to record lead" },
      { status: 500 },
    );
  }
}
