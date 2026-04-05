import { NextRequest, NextResponse } from "next/server";
import { apiEndpoints } from "@/lib/api/endpoints";
import { getApiBaseUrl } from "@/lib/api/config";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/session";
import {
  createUnauthorizedAuthResponse,
  getRememberSessionFromRequest,
  setAuthSessionCookies,
} from "@/lib/auth/route-auth";
import { getAuthUserFromAccessToken, isAccessTokenExpired } from "@/lib/auth/token";

function getBackendErrorMessage(responseBody: unknown) {
  if (
    responseBody &&
    typeof responseBody === "object" &&
    !Array.isArray(responseBody) &&
    "detail" in responseBody &&
    typeof responseBody.detail === "string" &&
    responseBody.detail.trim().length > 0
  ) {
    return responseBody.detail;
  }

  if (typeof responseBody === "string" && responseBody.trim().length > 0) {
    return responseBody;
  }

  return "Unable to refresh the session.";
}

export async function POST(request: NextRequest) {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_API_URL is not configured." },
      { status: 500 },
    );
  }

  const accessToken = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
  const rememberSession = getRememberSessionFromRequest(request);

  if (!accessToken || isAccessTokenExpired(accessToken)) {
    return createUnauthorizedAuthResponse("Your session has expired.");
  }

  try {
    const backendResponse = await fetch(`${apiBaseUrl}${apiEndpoints.auth.refresh}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    const contentType = backendResponse.headers.get("content-type") ?? "";
    const responseBody = contentType.includes("application/json")
      ? await backendResponse.json()
      : await backendResponse.text();

    if (!backendResponse.ok) {
      if (backendResponse.status === 401) {
        return createUnauthorizedAuthResponse(getBackendErrorMessage(responseBody));
      }

      return NextResponse.json(
        { error: getBackendErrorMessage(responseBody) },
        { status: backendResponse.status },
      );
    }

    const nextAccessToken =
      responseBody &&
      typeof responseBody === "object" &&
      !Array.isArray(responseBody) &&
      "access_token" in responseBody &&
      typeof responseBody.access_token === "string"
        ? responseBody.access_token
        : null;

    if (!nextAccessToken) {
      return NextResponse.json(
        { error: "Backend refresh response is missing an access token." },
        { status: 502 },
      );
    }

    const authUser = getAuthUserFromAccessToken(nextAccessToken);
    const response = NextResponse.json({ ok: true });

    setAuthSessionCookies(response, {
      accessToken: nextAccessToken,
      role: authUser.role ?? "",
      rememberSession,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the FastAPI backend." },
      { status: 502 },
    );
  }
}
