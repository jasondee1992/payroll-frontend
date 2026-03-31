export const AUTH_TOKEN_COOKIE = "payroll_access_token";
export const AUTH_SESSION_MAX_AGE = 60 * 60 * 24 * 30;
export const DEFAULT_AUTH_REDIRECT = "/dashboard";

const PROTECTED_PATH_PREFIXES = [
  "/dashboard",
  "/employees",
  "/attendance",
  "/payroll",
  "/payslips",
  "/reports",
  "/settings",
] as const;

export function isProtectedPath(pathname: string) {
  if (pathname === "/") {
    return true;
  }

  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function getSafeRedirectPath(
  redirectTo: string | null | undefined,
  fallback = DEFAULT_AUTH_REDIRECT,
) {
  if (!redirectTo || !redirectTo.startsWith("/") || redirectTo.startsWith("//")) {
    return fallback;
  }

  if (redirectTo.startsWith("/api/auth")) {
    return fallback;
  }

  return redirectTo;
}
