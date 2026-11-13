import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, isValidSessionToken } from "@/lib/devAuth";
import { HACKATHON_BASE, HACKATHON_COOKIE, isValidHackathonToken } from "@/lib/hackathonAuth";

const DASHBOARD_BASE = "/pl-a9004ed60a";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Hackathon staff area: its own password and cookie.
  if (path === HACKATHON_BASE || path.startsWith(`${HACKATHON_BASE}/`)) {
    if (path === `${HACKATHON_BASE}/login`) return NextResponse.next();
    if (!(await isValidHackathonToken(request.cookies.get(HACKATHON_COOKIE)?.value))) {
      return NextResponse.redirect(new URL(`${HACKATHON_BASE}/login`, request.url));
    }
    return NextResponse.next();
  }

  if (path === `${DASHBOARD_BASE}/login`) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!(await isValidSessionToken(token))) {
    return NextResponse.redirect(new URL(`${DASHBOARD_BASE}/login`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/pl-a9004ed60a/:path*", "/pl-ac", "/pl-ac/:path*"],
};
