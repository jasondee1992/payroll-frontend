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

const EMPLOYEE_ALLOWED_PATHS = new Set<string>(["/dashboard", "/attendance"]);
const ADMIN_FINANCE_BLOCKED_PATHS = new Set<string>(["/employees"]);
const SYSTEM_ADMIN_ALLOWED_PATHS = new Set<string>(["/employees", "/settings"]);
const HR_ALLOWED_PATHS = new Set<string>([
  "/dashboard",
  "/employees",
  "/attendance",
  "/settings",
]);
const FINANCE_ALLOWED_PATHS = new Set<string>([
  "/dashboard",
  "/attendance",
  "/payroll",
  "/payslips",
]);

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
  const rawUserRole = request.cookies.get(AUTH_ROLE_COOKIE)?.value?.trim().toLowerCase();
  const userRole = normalizeAppRole(rawUserRole);
  const passwordChangeRequired =
    request.cookies.get(PASSWORD_CHANGE_REQUIRED_COOKIE)?.value === "1";

  if (pathname === "/login" && hasAuthToken) {
    const redirectTarget = passwordChangeRequired
      ? CHANGE_PASSWORD_REDIRECT
      : getSafeRedirectPath(
          request.nextUrl.searchParams.get("next"),
          getDefaultRedirectForRole(rawUserRole),
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
    rawUserRole === "system-admin" &&
    isProtectedPath(pathname) &&
    !isSystemAdminAllowedPath(pathname)
  ) {
    return NextResponse.redirect(new URL("/employees", request.url));
  }

  if (
    hasAuthToken &&
    userRole === "admin-finance" &&
    isProtectedPath(pathname) &&
    isAdminFinanceBlockedPath(pathname)
  ) {
    return NextResponse.redirect(new URL(DEFAULT_AUTH_REDIRECT, request.url));
  }

  if (
    hasAuthToken &&
    userRole === "employee" &&
    isProtectedPath(pathname) &&
    !isEmployeeAllowedPath(pathname)
  ) {
    return NextResponse.redirect(new URL(DEFAULT_AUTH_REDIRECT, request.url));
  }

  if (
    hasAuthToken &&
    userRole === "hr" &&
    isProtectedPath(pathname) &&
    !isHrAllowedPath(pathname)
  ) {
    return NextResponse.redirect(new URL(DEFAULT_AUTH_REDIRECT, request.url));
  }

  if (
    hasAuthToken &&
    userRole === "finance" &&
    isProtectedPath(pathname) &&
    !isFinanceAllowedPath(pathname)
  ) {
    return NextResponse.redirect(new URL(DEFAULT_AUTH_REDIRECT, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};

function getDefaultRedirectForRole(role: string | undefined) {
  if (role === "system-admin") {
    return "/employees";
  }

  return DEFAULT_AUTH_REDIRECT;
}

function isEmployeeAllowedPath(pathname: string) {
  for (const allowedPath of EMPLOYEE_ALLOWED_PATHS) {
    if (pathname === allowedPath || pathname.startsWith(`${allowedPath}/`)) {
      return true;
    }
  }

  return false;
}

function isSystemAdminAllowedPath(pathname: string) {
  for (const allowedPath of SYSTEM_ADMIN_ALLOWED_PATHS) {
    if (pathname === allowedPath || pathname.startsWith(`${allowedPath}/`)) {
      return true;
    }
  }

  return false;
}

function isAdminFinanceBlockedPath(pathname: string) {
  for (const blockedPath of ADMIN_FINANCE_BLOCKED_PATHS) {
    if (pathname === blockedPath || pathname.startsWith(`${blockedPath}/`)) {
      return true;
    }
  }

  return false;
}

function isHrAllowedPath(pathname: string) {
  for (const allowedPath of HR_ALLOWED_PATHS) {
    if (pathname === allowedPath || pathname.startsWith(`${allowedPath}/`)) {
      return true;
    }
  }

  return false;
}

function isFinanceAllowedPath(pathname: string) {
  for (const allowedPath of FINANCE_ALLOWED_PATHS) {
    if (pathname === allowedPath || pathname.startsWith(`${allowedPath}/`)) {
      return true;
    }
  }

  return false;
}
