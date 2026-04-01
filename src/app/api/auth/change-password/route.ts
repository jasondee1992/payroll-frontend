import { NextRequest, NextResponse } from "next/server";
import { apiEndpoints } from "@/lib/api/endpoints";
import { getApiBaseUrl } from "@/lib/api/config";
import {
  AUTH_TOKEN_COOKIE,
  DEFAULT_AUTH_REDIRECT,
  PASSWORD_CHANGE_REQUIRED_COOKIE,
} from "@/lib/auth/session";

type ChangePasswordRequestBody = {
  currentPassword?: unknown;
  newPassword?: unknown;
};

function getStringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

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

  return "Unable to change the password.";
}

export async function POST(request: NextRequest) {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_API_URL is not configured." },
      { status: 500 },
    );
  }

  let body: ChangePasswordRequestBody;

  try {
    body = (await request.json()) as ChangePasswordRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid password change payload." },
      { status: 400 },
    );
  }

  const currentPassword = getStringValue(body.currentPassword);
  const newPassword = getStringValue(body.newPassword);
  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Current password and new password are required." },
      { status: 400 },
    );
  }

  const authToken = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;

  if (!authToken) {
    return NextResponse.json(
      { error: "You must be signed in to change the password." },
      { status: 401 },
    );
  }

  try {
    const backendResponse = await fetch(
      `${apiBaseUrl}${apiEndpoints.auth.changePassword}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        cache: "no-store",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      },
    );

    const contentType = backendResponse.headers.get("content-type") ?? "";
    const responseBody = contentType.includes("application/json")
      ? await backendResponse.json()
      : await backendResponse.text();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: getBackendErrorMessage(responseBody) },
        { status: backendResponse.status },
      );
    }

    const response = NextResponse.json({
      ok: true,
      redirectTo: DEFAULT_AUTH_REDIRECT,
    });

    response.cookies.set({
      name: PASSWORD_CHANGE_REQUIRED_COOKIE,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(0),
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the FastAPI backend." },
      { status: 502 },
    );
  }
}
