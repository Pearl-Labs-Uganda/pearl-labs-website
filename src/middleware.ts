import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, isValidSessionToken } from "@/lib/devAuth";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/dev/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!(await isValidSessionToken(token))) {
    return NextResponse.redirect(new URL("/dev/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dev/:path*"],
};
