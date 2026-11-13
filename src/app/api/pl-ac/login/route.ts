import { NextResponse } from "next/server";
import { HACKATHON_COOKIE, createHackathonToken, verifyHackathonPassword } from "@/lib/hackathonAuth";
import { clientKey, createRateLimiter } from "@/lib/placement";

// Slows password guessing: 10 tries per 15 minutes per connection.
const allow = createRateLimiter(10, 15 * 60 * 1000);

export async function POST(request: Request) {
  const ip = clientKey(request.headers.get("x-forwarded-for"), request.headers.get("x-real-ip"));
  if (!allow(ip)) {
    return NextResponse.json({ error: "Too many tries — wait 15 minutes and try again." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password : "";
  if (!password || !verifyHackathonPassword(password)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(HACKATHON_COOKIE, await createHackathonToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
