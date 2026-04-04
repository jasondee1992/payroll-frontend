export const AUTH_TOKEN_COOKIE = "payroll_access_token";
export const AUTH_ROLE_COOKIE = "payroll_user_role";
export const PASSWORD_CHANGE_REQUIRED_COOKIE = "payroll_password_change_required";
export const AUTH_SESSION_MAX_AGE = 60 * 60 * 24 * 30;
export const DEFAULT_AUTH_REDIRECT = "/dashboard";
export const CHANGE_PASSWORD_REDIRECT = "/change-password";

export type AppRole =
  | "admin"
  | "admin-finance"
  | "finance"
  | "hr"
  | "employee";

const ATTENDANCE_UPLOAD_ROLES = new Set<AppRole>([
  "admin-finance",
  "finance",
  "hr",
]);
const ATTENDANCE_UNLOCK_ROLES = new Set<AppRole>([
  "admin-finance",
  "finance",
]);
const PAYROLL_VIEW_ROLES = new Set<AppRole>(["admin-finance", "finance"]);
const PAYROLL_MANAGE_ROLES = new Set<AppRole>(["admin-finance"]);
const PAYSLIP_VIEW_ROLES = new Set<AppRole>([
  "admin-finance",
  "finance",
  "employee",
]);

const PROTECTED_PATH_PREFIXES = [
  "/dashboard",
  "/employees",
  "/attendance",
  "/leave-requests",
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

export function normalizeAppRole(value: string | null | undefined): AppRole | null {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue === "system-admin") {
    return "admin";
  }

  if (
    normalizedValue === "admin" ||
    normalizedValue === "admin-finance" ||
    normalizedValue === "finance" ||
    normalizedValue === "hr" ||
    normalizedValue === "employee"
  ) {
    return normalizedValue;
  }

  return null;
}

export function canManageTeamAttendance(role: AppRole | null | undefined) {
  return role != null && role !== "employee";
}

export function canManageAttendanceUploads(role: AppRole | null | undefined) {
  return role != null && ATTENDANCE_UPLOAD_ROLES.has(role);
}

export function canDeleteAttendanceCutoffs(role: AppRole | null | undefined) {
  return role === "admin-finance";
}

export function canUnlockAttendanceCutoffs(role: AppRole | null | undefined) {
  return role != null && ATTENDANCE_UNLOCK_ROLES.has(role);
}

export function canViewPayroll(role: AppRole | null | undefined) {
  return role != null && PAYROLL_VIEW_ROLES.has(role);
}

export function canManagePayroll(role: AppRole | null | undefined) {
  return role != null && PAYROLL_MANAGE_ROLES.has(role);
}

export function canManagePayrollSettings(role: AppRole | null | undefined) {
  return canManagePayroll(role);
}

export function canViewPayslips(role: AppRole | null | undefined) {
  return role != null && PAYSLIP_VIEW_ROLES.has(role);
}
