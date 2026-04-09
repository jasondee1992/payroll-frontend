import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api/config";
import {
  canApprovePayroll,
  canFinalizePayroll,
  canManagePayrollPolicyProfiles,
  AUTH_ROLE_COOKIE,
  AUTH_TOKEN_COOKIE,
  canManagePayrollAdjustments,
  canManagePayroll,
  canReleasePayslips,
  canReviewPayroll,
  canViewPayroll,
  canViewPayrollPolicyProfiles,
  canViewPayslips,
  normalizeAppRole,
} from "@/lib/auth/session";
import { createUnauthorizedAuthResponse } from "@/lib/auth/route-auth";
import { getRoleFromAccessToken } from "@/lib/auth/token";

function buildBackendUrl(request: NextRequest, pathSegments: string[] | undefined) {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return null;
  }

  const normalizedPath =
    pathSegments && pathSegments.length > 0 ? `/${pathSegments.join("/")}` : "";
  const backendUrl = new URL(`${apiBaseUrl}/api/v1/payroll${normalizedPath}`);

  request.nextUrl.searchParams.forEach((value, key) => {
    backendUrl.searchParams.set(key, value);
  });

  return backendUrl;
}

function isEmployeePayslipRequest(pathSegments: string[] | undefined) {
  return (
    Array.isArray(pathSegments) &&
    pathSegments.length >= 2 &&
    pathSegments[0] === "me" &&
    pathSegments[1] === "payslips"
  );
}

function isSettingsRequest(pathSegments: string[] | undefined) {
  return Array.isArray(pathSegments) && pathSegments[0] === "settings";
}

function isPayrollPolicyProfilesRequest(pathSegments: string[] | undefined) {
  return (
    Array.isArray(pathSegments) &&
    pathSegments.length >= 2 &&
    pathSegments[0] === "settings" &&
    pathSegments[1] === "policy-profiles"
  );
}

function isEmployeeEffectiveRulesRequest(pathSegments: string[] | undefined) {
  return (
    Array.isArray(pathSegments) &&
    pathSegments.length >= 3 &&
    pathSegments[0] === "employees" &&
    pathSegments[2] === "effective-rules"
  );
}

function isManualAdjustmentsRequest(pathSegments: string[] | undefined) {
  return Array.isArray(pathSegments) && pathSegments[0] === "adjustments";
}

function isReviewBatchRequest(pathSegments: string[] | undefined) {
  return (
    Array.isArray(pathSegments) &&
    pathSegments.length === 3 &&
    pathSegments[0] === "batches" &&
    pathSegments[2] === "review"
  );
}

function isApproveBatchRequest(pathSegments: string[] | undefined) {
  return (
    Array.isArray(pathSegments) &&
    pathSegments.length === 3 &&
    pathSegments[0] === "batches" &&
    pathSegments[2] === "approve"
  );
}

function isFinalizeBatchRequest(pathSegments: string[] | undefined) {
  return (
    Array.isArray(pathSegments) &&
    pathSegments.length === 3 &&
    pathSegments[0] === "batches" &&
    pathSegments[2] === "finalize"
  );
}

function isReleasePayslipsRequest(pathSegments: string[] | undefined) {
  return (
    Array.isArray(pathSegments) &&
    pathSegments.length === 3 &&
    pathSegments[0] === "batches" &&
    pathSegments[2] === "release-payslips"
  );
}

function canReadPayrollPath(
  userRole: ReturnType<typeof normalizeAppRole>,
  pathSegments: string[] | undefined,
) {
  if (isPayrollPolicyProfilesRequest(pathSegments) || isEmployeeEffectiveRulesRequest(pathSegments)) {
    return canViewPayrollPolicyProfiles(userRole);
  }

  if (isSettingsRequest(pathSegments)) {
    return canManagePayroll(userRole);
  }

  if (isEmployeePayslipRequest(pathSegments)) {
    return userRole === "employee";
  }

  if (Array.isArray(pathSegments) && pathSegments[0] === "payslips") {
    return canViewPayroll(userRole);
  }

  return canViewPayroll(userRole);
}

function canWritePayrollPath(
  userRole: ReturnType<typeof normalizeAppRole>,
  pathSegments: string[] | undefined,
) {
  if (isManualAdjustmentsRequest(pathSegments)) {
    return canManagePayrollAdjustments(userRole);
  }

  if (isPayrollPolicyProfilesRequest(pathSegments)) {
    return canManagePayrollPolicyProfiles(userRole);
  }

  if (isReviewBatchRequest(pathSegments)) {
    return canReviewPayroll(userRole);
  }

  if (isApproveBatchRequest(pathSegments)) {
    return canApprovePayroll(userRole);
  }

  if (isFinalizeBatchRequest(pathSegments)) {
    return canFinalizePayroll(userRole);
  }

  if (isReleasePayslipsRequest(pathSegments)) {
    return canReleasePayslips(userRole);
  }

  return canManagePayroll(userRole);
}

function getPayrollWriteAccessError(
  userRole: ReturnType<typeof normalizeAppRole>,
  pathSegments: string[] | undefined,
) {
  if (isManualAdjustmentsRequest(pathSegments)) {
    return "Only Admin and Admin-Finance users can manage manual payroll adjustments.";
  }

  if (isPayrollPolicyProfilesRequest(pathSegments)) {
    return "Only Admin and Admin-Finance users can update payroll policy profiles.";
  }

  if (isReviewBatchRequest(pathSegments)) {
    return "Only Finance and Admin-Finance users can review payroll batches.";
  }

  if (isApproveBatchRequest(pathSegments)) {
    return "Only Admin-Finance users can approve payroll batches.";
  }

  if (isFinalizeBatchRequest(pathSegments)) {
    return "Only Admin-Finance users can finalize payroll batches.";
  }

  if (isReleasePayslipsRequest(pathSegments)) {
    return "Only Admin-Finance users can release payslips.";
  }

  return canManagePayroll(userRole)
    ? "You already have access."
    : "Only Admin-Finance users can calculate, recalculate, or discard payroll workflow records.";
}

async function proxyPayrollRequest(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await context.params;
  const accessToken = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
  const userRole =
    normalizeAppRole(request.cookies.get(AUTH_ROLE_COOKIE)?.value) ??
    (accessToken ? getRoleFromAccessToken(accessToken) : null);

  if (request.method === "GET") {
    if (!canReadPayrollPath(userRole, path)) {
      return NextResponse.json(
        {
          error:
            isSettingsRequest(path)
              ? isPayrollPolicyProfilesRequest(path)
                ? "Only Admin, Admin-Finance, Finance, and HR users can access payroll policy profiles."
                : "Only Admin-Finance users can access government deduction settings."
              : isEmployeeEffectiveRulesRequest(path)
                ? "Only Admin, Admin-Finance, Finance, and HR users can access effective payroll rules."
              : isEmployeePayslipRequest(path) || (userRole === "employee" && canViewPayslips(userRole))
              ? "You can only view your own posted payslips."
              : "Only Admin, Finance, and Admin-Finance users can access payroll workflow data.",
        },
        { status: 403 },
      );
    }
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    const canManageWriteRequest = canWritePayrollPath(userRole, path);

    if (canManageWriteRequest) {
      return proxyToBackend(request, accessToken, path);
    }

    return NextResponse.json(
      {
        error: getPayrollWriteAccessError(userRole, path),
      },
      { status: 403 },
    );
  }

  return proxyToBackend(request, accessToken, path);
}

async function proxyToBackend(
  request: NextRequest,
  accessToken: string | undefined,
  path: string[] | undefined,
) {
  const backendUrl = buildBackendUrl(request, path);

  if (!backendUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_API_URL is not configured." },
      { status: 500 },
    );
  }

  const headers = new Headers({
    Accept: "application/json",
  });

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let body: BodyInit | undefined;

  if (request.method !== "GET" && request.method !== "HEAD") {
    const contentType = request.headers.get("content-type") ?? "";
    const rawBody = await request.text();

    if (rawBody.length > 0) {
      body = rawBody;

      if (contentType) {
        headers.set("Content-Type", contentType);
      }
    }
  }

  try {
    const backendResponse = await fetch(backendUrl.toString(), {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });

    const responseContentType = backendResponse.headers.get("content-type") ?? "";
    const responseBody = responseContentType.includes("application/json")
      ? await backendResponse.json()
      : await backendResponse.text();

    if (!backendResponse.ok) {
      if (backendResponse.status === 401) {
        return createUnauthorizedAuthResponse(
          typeof responseBody === "string"
            ? responseBody || "Your session is no longer valid."
            : responseBody &&
                typeof responseBody === "object" &&
                "detail" in responseBody &&
                typeof responseBody.detail === "string"
              ? responseBody.detail
              : "Your session is no longer valid.",
        );
      }

      return NextResponse.json(
        typeof responseBody === "string" ? { error: responseBody } : responseBody,
        { status: backendResponse.status },
      );
    }

    if (backendResponse.status === 204) {
      return new NextResponse(null, {
        status: backendResponse.status,
      });
    }

    return NextResponse.json(responseBody, {
      status: backendResponse.status,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the FastAPI backend." },
      { status: 502 },
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxyPayrollRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxyPayrollRequest(request, context);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxyPayrollRequest(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxyPayrollRequest(request, context);
}
