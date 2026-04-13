export const AUTH_TOKEN_COOKIE = "payroll_access_token";
export const AUTH_ROLE_COOKIE = "payroll_user_role";
export const PASSWORD_CHANGE_REQUIRED_COOKIE = "payroll_password_change_required";
export const AUTH_SESSION_PERSISTENCE_COOKIE = "payroll_session_persistent";
export const AUTH_SESSION_MAX_AGE = 60 * 60 * 24 * 30;
export const AUTH_IDLE_TIMEOUT_MS = 15 * 60 * 1000;
export const AUTH_SESSION_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
export const AUTH_ACTIVITY_STORAGE_KEY = "payroll.auth.last-activity-at";
export const AUTH_FORCE_LOGOUT_STORAGE_KEY = "payroll.auth.force-logout-at";
export const DEFAULT_AUTH_REDIRECT = "/dashboard";
export const CHANGE_PASSWORD_REDIRECT = "/change-password";

export type AppRole =
  | "admin"
  | "admin-finance"
  | "finance"
  | "hr"
  | "system-admin"
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
const EMPLOYEE_VIEW_ROLES = new Set<AppRole>([
  "admin",
  "admin-finance",
  "finance",
  "hr",
  "system-admin",
]);
const EMPLOYEE_MANAGE_ROLES = new Set<AppRole>(["admin", "hr", "system-admin"]);
const EMPLOYEE_LOAN_VIEW_ROLES = new Set<AppRole>([
  "admin",
  "admin-finance",
  "finance",
  "hr",
]);
const EMPLOYEE_LOAN_MANAGE_ROLES = new Set<AppRole>(["hr"]);
const EXCEPTION_DASHBOARD_VIEW_ROLES = new Set<AppRole>([
  "admin",
  "admin-finance",
  "finance",
  "hr",
]);
const PAYROLL_VIEW_ROLES = new Set<AppRole>(["admin", "admin-finance", "finance"]);
const PAYROLL_MANAGE_ROLES = new Set<AppRole>(["admin-finance"]);
const PAYROLL_REVIEW_ROLES = new Set<AppRole>(["finance", "admin-finance"]);
const PAYROLL_APPROVE_ROLES = new Set<AppRole>(["admin-finance"]);
const PAYROLL_FINALIZE_ROLES = new Set<AppRole>(["admin-finance"]);
const PAYSLIP_RELEASE_ROLES = new Set<AppRole>(["admin-finance"]);
const PAYROLL_ADJUSTMENT_MANAGE_ROLES = new Set<AppRole>(["admin", "admin-finance"]);
const PAYROLL_POLICY_VIEW_ROLES = new Set<AppRole>([
  "admin",
  "admin-finance",
  "finance",
  "hr",
  "system-admin",
]);
const PAYROLL_POLICY_MANAGE_ROLES = new Set<AppRole>(["admin", "admin-finance"]);
const PAYSLIP_VIEW_ROLES = new Set<AppRole>([
  "admin-finance",
  "finance",
  "employee",
]);
const HOLIDAY_VIEW_ROLES = new Set<AppRole>([
  "admin",
  "admin-finance",
  "finance",
  "hr",
]);
const HOLIDAY_MANAGE_ROLES = new Set<AppRole>([
  "admin",
  "admin-finance",
  "hr",
]);
const AUDIT_LOG_VIEW_ROLES = new Set<AppRole>([
  "admin",
  "admin-finance",
  "finance",
  "hr",
]);

const PROTECTED_PATH_PREFIXES = [
  "/dashboard",
  "/exceptions",
  "/employees",
  "/attendance",
  "/notifications",
  "/holidays",
  "/leave-requests",
  "/payroll",
  "/payslips",
  "/reports",
  "/audit-logs",
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

  if (
    normalizedValue === "admin" ||
    normalizedValue === "admin-finance" ||
    normalizedValue === "finance" ||
    normalizedValue === "hr" ||
    normalizedValue === "system-admin" ||
    normalizedValue === "employee"
  ) {
    return normalizedValue;
  }

  return null;
}

export function canManageTeamAttendance(role: AppRole | null | undefined) {
  return role != null && role !== "employee" && role !== "system-admin";
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

export function canViewEmployees(role: AppRole | null | undefined) {
  return role != null && EMPLOYEE_VIEW_ROLES.has(role);
}

export function canManageEmployees(role: AppRole | null | undefined) {
  return role != null && EMPLOYEE_MANAGE_ROLES.has(role);
}

export function canViewEmployeeLoans(role: AppRole | null | undefined) {
  return role != null && EMPLOYEE_LOAN_VIEW_ROLES.has(role);
}

export function canViewExceptionDashboard(role: AppRole | null | undefined) {
  return role != null && EXCEPTION_DASHBOARD_VIEW_ROLES.has(role);
}

export function canManageEmployeeLoans(role: AppRole | null | undefined) {
  return role != null && EMPLOYEE_LOAN_MANAGE_ROLES.has(role);
}

export function canViewPayroll(role: AppRole | null | undefined) {
  return role != null && PAYROLL_VIEW_ROLES.has(role);
}

export function canManagePayroll(role: AppRole | null | undefined) {
  return role != null && PAYROLL_MANAGE_ROLES.has(role);
}

export function canReviewPayroll(role: AppRole | null | undefined) {
  return role != null && PAYROLL_REVIEW_ROLES.has(role);
}

export function canApprovePayroll(role: AppRole | null | undefined) {
  return role != null && PAYROLL_APPROVE_ROLES.has(role);
}

export function canFinalizePayroll(role: AppRole | null | undefined) {
  return role != null && PAYROLL_FINALIZE_ROLES.has(role);
}

export function canReleasePayslips(role: AppRole | null | undefined) {
  return role != null && PAYSLIP_RELEASE_ROLES.has(role);
}

export function canManagePayrollAdjustments(role: AppRole | null | undefined) {
  return role != null && PAYROLL_ADJUSTMENT_MANAGE_ROLES.has(role);
}

export function canManagePayrollSettings(role: AppRole | null | undefined) {
  return canManagePayroll(role);
}

export function canViewPayrollPolicyProfiles(role: AppRole | null | undefined) {
  return role != null && PAYROLL_POLICY_VIEW_ROLES.has(role);
}

export function canManagePayrollPolicyProfiles(role: AppRole | null | undefined) {
  return role != null && PAYROLL_POLICY_MANAGE_ROLES.has(role);
}

export function canViewHolidayCalendar(role: AppRole | null | undefined) {
  return role != null && HOLIDAY_VIEW_ROLES.has(role);
}

export function canManageHolidayCalendar(role: AppRole | null | undefined) {
  return role != null && HOLIDAY_MANAGE_ROLES.has(role);
}

export function canViewAuditLogs(role: AppRole | null | undefined) {
  return role != null && AUDIT_LOG_VIEW_ROLES.has(role);
}

export function canViewPayslips(role: AppRole | null | undefined) {
  return role != null && PAYSLIP_VIEW_ROLES.has(role);
}
