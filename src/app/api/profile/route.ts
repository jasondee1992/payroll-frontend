import { NextRequest, NextResponse } from "next/server";
import { apiEndpoints } from "@/lib/api/endpoints";
import { getApiBaseUrl } from "@/lib/api/config";
import {
  AUTH_ROLE_COOKIE,
  AUTH_TOKEN_COOKIE,
} from "@/lib/auth/session";
import { createUnauthorizedAuthResponse } from "@/lib/auth/route-auth";
import { getAuthUserFromAccessToken } from "@/lib/auth/token";

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

  return "Unable to process the profile request.";
}

export async function GET(request: NextRequest) {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_API_URL is not configured." },
      { status: 500 },
    );
  }

  const accessToken = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;

  try {
    const response = await fetch(`${apiBaseUrl}${apiEndpoints.auth.me}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") ?? "";
    const responseBody = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      if (response.status === 401) {
        return createUnauthorizedAuthResponse(
          getBackendErrorMessage(responseBody),
        );
      }

      return NextResponse.json(
        { error: getBackendErrorMessage(responseBody) },
        { status: response.status },
      );
    }

    return NextResponse.json(responseBody);
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the FastAPI backend." },
      { status: 502 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_API_URL is not configured." },
      { status: 500 },
    );
  }

  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid profile update payload." },
      { status: 400 },
    );
  }

  const accessToken = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;

  try {
    const response = await fetch(`${apiBaseUrl}${apiEndpoints.auth.me}`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      cache: "no-store",
      body: JSON.stringify(body),
    });

    const contentType = response.headers.get("content-type") ?? "";
    const responseBody = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      if (response.status === 401) {
        return createUnauthorizedAuthResponse(
          getBackendErrorMessage(responseBody),
        );
      }

      return NextResponse.json(
        { error: getBackendErrorMessage(responseBody) },
        { status: response.status },
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
    const profile =
      responseBody &&
      typeof responseBody === "object" &&
      !Array.isArray(responseBody) &&
      "profile" in responseBody
        ? responseBody.profile
        : responseBody;

    const nextResponse = NextResponse.json(profile);

    if (nextAccessToken) {
      const authUser = getAuthUserFromAccessToken(nextAccessToken);
      nextResponse.cookies.set({
        name: AUTH_TOKEN_COOKIE,
        value: nextAccessToken,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
      nextResponse.cookies.set({
        name: AUTH_ROLE_COOKIE,
        value: authUser.role ?? "",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }

    return nextResponse;
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the FastAPI backend." },
      { status: 502 },
    );
  }
}
