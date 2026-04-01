import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  AUTH_ROLE_COOKIE,
  AUTH_TOKEN_COOKIE,
  CHANGE_PASSWORD_REDIRECT,
  DEFAULT_AUTH_REDIRECT,
  PASSWORD_CHANGE_REQUIRED_COOKIE,
  getSafeRedirectPath,
  isProtectedPath,
  normalizeAppRole,
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
  const userRole = normalizeAppRole(request.cookies.get(AUTH_ROLE_COOKIE)?.value);
  const passwordChangeRequired =
    request.cookies.get(PASSWORD_CHANGE_REQUIRED_COOKIE)?.value === "1";

  if (pathname === "/login" && hasAuthToken) {
    const redirectTarget = passwordChangeRequired
      ? CHANGE_PASSWORD_REDIRECT
      : getSafeRedirectPath(
          request.nextUrl.searchParams.get("next"),
          DEFAULT_AUTH_REDIRECT,
        );
    return NextResponse.redirect(new URL(redirectTarget, request.url));
  }

  if (pathname === CHANGE_PASSWORD_REDIRECT) {
    if (!hasAuthToken) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = "";
      loginUrl.searchParams.set("next", CHANGE_PASSWORD_REDIRECT);
      return NextResponse.redirect(loginUrl);
    }

    if (!passwordChangeRequired) {
      return NextResponse.redirect(new URL(DEFAULT_AUTH_REDIRECT, request.url));
    }

    return NextResponse.next();
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

  if (hasAuthToken && passwordChangeRequired && isProtectedPath(pathname)) {
    return NextResponse.redirect(new URL(CHANGE_PASSWORD_REDIRECT, request.url));
  }

  if (
    hasAuthToken &&
    userRole === "employee" &&
    isProtectedPath(pathname) &&
    pathname !== "/dashboard"
  ) {
    return NextResponse.redirect(new URL(DEFAULT_AUTH_REDIRECT, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
