import { NextRequest, NextResponse } from "next/server";
import { adminSessionCookieName, isValidAdminSession } from "@/lib/demo-auth";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(adminSessionCookieName())?.value;
  if (await isValidAdminSession(token)) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!login|api/auth|api/health|_next/static|_next/image|favicon.ico).*)"]
};
