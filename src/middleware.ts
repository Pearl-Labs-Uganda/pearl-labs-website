import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, isValidSessionToken } from "@/lib/devAuth";

const DASHBOARD_BASE = "/pl-a9004ed60a";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === `${DASHBOARD_BASE}/login`) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!(await isValidSessionToken(token))) {
    return NextResponse.redirect(new URL(`${DASHBOARD_BASE}/login`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/pl-a9004ed60a/:path*"],
};
