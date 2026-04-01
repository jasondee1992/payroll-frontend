import { NextResponse } from "next/server";
import { apiEndpoints } from "@/lib/api/endpoints";
import { getApiBaseUrl } from "@/lib/api/config";
import {
  AUTH_SESSION_MAX_AGE,
  CHANGE_PASSWORD_REDIRECT,
  AUTH_TOKEN_COOKIE,
  PASSWORD_CHANGE_REQUIRED_COOKIE,
  getSafeRedirectPath,
} from "@/lib/auth/session";

type LoginRequestBody = {
  usernameOrEmail?: unknown;
  password?: unknown;
  remember?: unknown;
  redirectTo?: unknown;
};

function getStringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_API_URL is not configured." },
      { status: 500 },
    );
  }

  let body: LoginRequestBody;

  try {
    body = (await request.json()) as LoginRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid login payload." },
      { status: 400 },
    );
  }

  const usernameOrEmail = getStringValue(body.usernameOrEmail);
  const password = getStringValue(body.password);
  const remember = body.remember === true;
  const redirectTo = getSafeRedirectPath(
    typeof body.redirectTo === "string" ? body.redirectTo : null,
  );

  if (!usernameOrEmail || !password) {
    return NextResponse.json(
      { error: "Username or email and password are required." },
      { status: 400 },
    );
  }

  try {
    const backendResponse = await fetch(`${apiBaseUrl}${apiEndpoints.auth.login}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        username_or_email: usernameOrEmail,
        password,
      }),
    });

    const contentType = backendResponse.headers.get("content-type") ?? "";
    const responseBody = contentType.includes("application/json")
      ? await backendResponse.json()
      : await backendResponse.text();

    if (!backendResponse.ok) {
      const errorMessage =
        responseBody &&
        typeof responseBody === "object" &&
        "detail" in responseBody &&
        typeof responseBody.detail === "string"
          ? responseBody.detail
          : "Unable to sign in.";

      return NextResponse.json(
        { error: errorMessage },
        { status: backendResponse.status },
      );
    }

    const accessToken =
      responseBody &&
      typeof responseBody === "object" &&
      "access_token" in responseBody &&
      typeof responseBody.access_token === "string"
        ? responseBody.access_token
        : "";

    if (!accessToken) {
      return NextResponse.json(
        { error: "Backend login response is missing an access token." },
        { status: 502 },
      );
    }

    const passwordChangeRequired =
      responseBody &&
      typeof responseBody === "object" &&
      "password_change_required" in responseBody &&
      responseBody.password_change_required === true;

    const response = NextResponse.json({
      ok: true,
      redirectTo: passwordChangeRequired ? CHANGE_PASSWORD_REDIRECT : redirectTo,
    });

    response.cookies.set({
      name: AUTH_TOKEN_COOKIE,
      value: accessToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      ...(remember ? { maxAge: AUTH_SESSION_MAX_AGE } : {}),
    });

    if (passwordChangeRequired) {
      response.cookies.set({
        name: PASSWORD_CHANGE_REQUIRED_COOKIE,
        value: "1",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        ...(remember ? { maxAge: AUTH_SESSION_MAX_AGE } : {}),
      });
    } else {
      response.cookies.set({
        name: PASSWORD_CHANGE_REQUIRED_COOKIE,
        value: "",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        expires: new Date(0),
      });
    }

    return response;
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the FastAPI backend." },
      { status: 502 },
    );
  }
}
