import { NextRequest, NextResponse } from "next/server";

function hasSessionCookie(request: NextRequest) {
  const names = [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "__Host-authjs.session-token",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
  ];
  return names.some((name) => Boolean(request.cookies.get(name)?.value));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const publicPath =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/enter") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/u/") ||
    pathname.startsWith("/p/") ||
    pathname.startsWith("/_next");
  if (publicPath) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/me") && !hasSessionCookie(request)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
