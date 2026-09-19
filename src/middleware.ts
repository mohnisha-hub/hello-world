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
  // Keep the complete OAuth round-trip (including Auth.js's short-lived PKCE
  // cookie) on the public domain. Starting on a Vercel deployment hostname
  // and returning from Google to atelierperfumes.in drops that cookie and
  // causes Auth.js to reject the callback with InvalidCheck.
  const canonicalHost = "www.atelierperfumes.in";
  if (
    process.env.VERCEL_ENV === "production" &&
    request.nextUrl.hostname !== canonicalHost
  ) {
    const canonical = request.nextUrl.clone();
    canonical.protocol = "https:";
    canonical.host = canonicalHost;
    return NextResponse.redirect(canonical);
  }
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
