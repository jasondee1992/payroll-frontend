import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api/config";
import {
  AUTH_ROLE_COOKIE,
  AUTH_TOKEN_COOKIE,
  canManageAttendanceUploads,
  normalizeAppRole,
} from "@/lib/auth/session";
import { createUnauthorizedAuthResponse } from "@/lib/auth/route-auth";
import { getRoleFromAccessToken } from "@/lib/auth/token";

function buildBackendUrl(request: NextRequest, pathSegments: string[] | undefined) {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return null;
  }

  const normalizedPath = pathSegments && pathSegments.length > 0
    ? `/${pathSegments.join("/")}`
    : "";
  const backendUrl = new URL(`${apiBaseUrl}/api/v1/attendance${normalizedPath}`);

  request.nextUrl.searchParams.forEach((value, key) => {
    backendUrl.searchParams.set(key, value);
  });

  return backendUrl;
}

async function proxyAttendanceRequest(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await context.params;
  const accessToken = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
  const userRole =
    normalizeAppRole(request.cookies.get(AUTH_ROLE_COOKIE)?.value) ??
    (accessToken ? getRoleFromAccessToken(accessToken) : null);

  if (
    accessToken &&
    isRestrictedAttendanceWriteRequest(request.method, path) &&
    !canManageAttendanceUploads(userRole)
  ) {
    return NextResponse.json(
      { error: "Only Finance and HR users can manage attendance uploads and cutoffs." },
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

  const contentType = request.headers.get("content-type") ?? "";
  let body: BodyInit | undefined;

  if (request.method !== "GET" && request.method !== "HEAD") {
    if (contentType.includes("multipart/form-data")) {
      body = await request.formData();
    } else {
      const rawBody = await request.text();
      if (rawBody.length > 0) {
        body = rawBody;
        if (contentType) {
          headers.set("Content-Type", contentType);
        }
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
  return proxyAttendanceRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxyAttendanceRequest(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxyAttendanceRequest(request, context);
}

function isRestrictedAttendanceWriteRequest(
  method: string,
  pathSegments: string[] | undefined,
) {
  if (method !== "POST") {
    return false;
  }

  if (!pathSegments || pathSegments.length === 0) {
    return false;
  }

  if (pathSegments.length === 1 && pathSegments[0] === "cutoffs") {
    return true;
  }

  if (pathSegments[0] !== "cutoffs" || pathSegments.length < 3) {
    return false;
  }

  return (
    pathSegments[2] === "upload" ||
    pathSegments[2] === "import" ||
    pathSegments[2] === "process" ||
    pathSegments[2] === "lock"
  );
}
