import { NextRequest, NextResponse } from "next/server";
import { apiEndpoints } from "@/lib/api/endpoints";
import { getApiBaseUrl } from "@/lib/api/config";
import {
  AUTH_ROLE_COOKIE,
  AUTH_TOKEN_COOKIE,
  canManageEmployees,
  normalizeAppRole,
} from "@/lib/auth/session";
import { createUnauthorizedAuthResponse } from "@/lib/auth/route-auth";
import { getRoleFromAccessToken } from "@/lib/auth/token";

export async function GET(request: NextRequest) {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_API_URL is not configured." },
      { status: 500 },
    );
  }

  const accessToken = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
  const userRole =
    normalizeAppRole(request.cookies.get(AUTH_ROLE_COOKIE)?.value) ??
    (accessToken ? getRoleFromAccessToken(accessToken) : null);

  if (accessToken && !canManageEmployees(userRole)) {
    return NextResponse.json(
      { error: "You do not have access to employee import or export." },
      { status: 403 },
    );
  }

  const backendUrl = new URL(`${apiBaseUrl}${apiEndpoints.employees.export}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    backendUrl.searchParams.set(key, value);
  });

  try {
    const backendResponse = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "text/csv",
        ...(accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : {}),
      },
      cache: "no-store",
    });

    if (!backendResponse.ok) {
      const responseContentType = backendResponse.headers.get("content-type") ?? "";
      const responseBody = responseContentType.includes("application/json")
        ? await backendResponse.json()
        : await backendResponse.text();

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

    const headers = new Headers();
    headers.set(
      "Content-Type",
      backendResponse.headers.get("content-type") ?? "text/csv; charset=utf-8",
    );

    const contentDisposition = backendResponse.headers.get("content-disposition");
    if (contentDisposition) {
      headers.set("Content-Disposition", contentDisposition);
    }

    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      headers,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the FastAPI backend." },
      { status: 502 },
    );
  }
}
