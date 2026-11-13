import { NextResponse } from "next/server";
import { HACKATHON_COOKIE } from "@/lib/hackathonAuth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(HACKATHON_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
