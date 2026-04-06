import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api/config";
import {
  apiEndpoints,
} from "@/lib/api/endpoints";
import {
  AUTH_ROLE_COOKIE,
  AUTH_TOKEN_COOKIE,
  canManageEmployeeLoans,
  canViewEmployeeLoans,
  normalizeAppRole,
} from "@/lib/auth/session";
import { createUnauthorizedAuthResponse } from "@/lib/auth/route-auth";
import { getRoleFromAccessToken } from "@/lib/auth/token";

function getBackendErrorMessage(responseBody: unknown) {
  if (
    responseBody &&
    typeof responseBody === "object" &&
    !Array.isArray(responseBody)
  ) {
    if (
      "detail" in responseBody &&
      typeof responseBody.detail === "string" &&
      responseBody.detail.trim().length > 0
    ) {
      return responseBody.detail;
    }

    if (
      "error" in responseBody &&
      typeof responseBody.error === "string" &&
      responseBody.error.trim().length > 0
    ) {
      return responseBody.error;
    }
  }

  if (typeof responseBody === "string" && responseBody.trim().length > 0) {
    return responseBody;
  }

  return "Unable to process the employee loan request.";
}

export async function proxyEmployeeLoanRequest(
  request: NextRequest,
  backendPath: string,
) {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_API_URL is not configured." },
      { status: 500 },
    );
  }

  const accessToken = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return createUnauthorizedAuthResponse("Your session is no longer valid.");
  }

  const userRole =
    normalizeAppRole(request.cookies.get(AUTH_ROLE_COOKIE)?.value) ??
    getRoleFromAccessToken(accessToken);
  const canRead = canViewEmployeeLoans(userRole);
  const canWrite = canManageEmployeeLoans(userRole);

  if (request.method === "GET" && !canRead) {
    return NextResponse.json(
      { error: "You do not have access to employee loan records." },
      { status: 403 },
    );
  }

  if (request.method !== "GET" && !canWrite) {
    return NextResponse.json(
      { error: "Only HR users can manage employee government loans." },
      { status: 403 },
    );
  }

  const backendUrl = new URL(`${apiBaseUrl}${backendPath}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    backendUrl.searchParams.set(key, value);
  });

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
          getBackendErrorMessage(responseBody),
        );
      }

      return NextResponse.json(
        typeof responseBody === "string" ? { error: responseBody } : responseBody,
        { status: backendResponse.status },
      );
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

export function getEmployeeLoanCollectionPath(employeeId: string) {
  return apiEndpoints.employeeLoans.list(employeeId);
}

export function getEmployeeLoanDetailPath(employeeId: string, loanId: string) {
  return apiEndpoints.employeeLoans.detail(employeeId, loanId);
}

export function getEmployeeLoanStatusPath(employeeId: string, loanId: string) {
  return apiEndpoints.employeeLoans.status(employeeId, loanId);
}
