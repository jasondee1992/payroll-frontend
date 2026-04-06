import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api/config";
import {
  AUTH_ROLE_COOKIE,
  AUTH_TOKEN_COOKIE,
  canManagePayroll,
  canViewPayroll,
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

function canReadPayrollPath(
  userRole: ReturnType<typeof normalizeAppRole>,
  pathSegments: string[] | undefined,
) {
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
              ? "Only Admin-Finance users can access payroll deduction settings."
              : isEmployeePayslipRequest(path) || (userRole === "employee" && canViewPayslips(userRole))
              ? "You can only view your own posted payslips."
              : "Only Finance and Admin-Finance users can access payroll workflow data.",
        },
        { status: 403 },
      );
    }
  }

  if (request.method !== "GET" && request.method !== "HEAD" && !canManagePayroll(userRole)) {
    return NextResponse.json(
      {
        error:
          "Only Admin-Finance users can calculate, recalculate, approve, post, or discard payroll batches.",
      },
      { status: 403 },
    );
  }

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
