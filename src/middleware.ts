import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  AUTH_TOKEN_COOKIE,
  DEFAULT_AUTH_REDIRECT,
  getSafeRedirectPath,
  isProtectedPath,
} from "@/lib/auth/session";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const hasAuthToken = Boolean(request.cookies.get(AUTH_TOKEN_COOKIE)?.value);

  if (pathname === "/login" && hasAuthToken) {
    const redirectTarget = getSafeRedirectPath(
      request.nextUrl.searchParams.get("next"),
      DEFAULT_AUTH_REDIRECT,
    );
    return NextResponse.redirect(new URL(redirectTarget, request.url));
  }

  if (!hasAuthToken && isProtectedPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";

    if (pathname !== "/") {
      loginUrl.searchParams.set("next", `${pathname}${search}`);
    }

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
