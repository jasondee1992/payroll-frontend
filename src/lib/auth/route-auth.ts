import { NextResponse } from "next/server";
import {
  AUTH_ROLE_COOKIE,
  AUTH_SESSION_MAX_AGE,
  AUTH_SESSION_PERSISTENCE_COOKIE,
  AUTH_TOKEN_COOKIE,
  PASSWORD_CHANGE_REQUIRED_COOKIE,
} from "@/lib/auth/session";

function getBaseCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

function getPersistentCookieOptions(rememberSession: boolean) {
  return rememberSession ? { maxAge: AUTH_SESSION_MAX_AGE } : {};
}

export function shouldRememberSession(value: string | undefined) {
  return value === "1";
}

export function getRememberSessionFromRequest(request: { cookies: { get(name: string): { value: string } | undefined } }) {
  return shouldRememberSession(
    request.cookies.get(AUTH_SESSION_PERSISTENCE_COOKIE)?.value,
  );
}

export function setAuthSessionCookies(
  response: NextResponse,
  options: {
    accessToken: string;
    role: string;
    rememberSession: boolean;
  },
) {
  const cookieOptions = {
    ...getBaseCookieOptions(),
    ...getPersistentCookieOptions(options.rememberSession),
  };

  response.cookies.set({
    name: AUTH_TOKEN_COOKIE,
    value: options.accessToken,
    ...cookieOptions,
  });
  response.cookies.set({
    name: AUTH_ROLE_COOKIE,
    value: options.role,
    ...cookieOptions,
  });
  response.cookies.set({
    name: AUTH_SESSION_PERSISTENCE_COOKIE,
    value: options.rememberSession ? "1" : "0",
    ...cookieOptions,
  });
}

export function setPasswordChangeRequiredCookie(
  response: NextResponse,
  options: {
    required: boolean;
    rememberSession: boolean;
  },
) {
  if (!options.required) {
    response.cookies.set({
      name: PASSWORD_CHANGE_REQUIRED_COOKIE,
      value: "",
      ...getBaseCookieOptions(),
      expires: new Date(0),
    });
    return;
  }

  response.cookies.set({
    name: PASSWORD_CHANGE_REQUIRED_COOKIE,
    value: "1",
    ...getBaseCookieOptions(),
    ...getPersistentCookieOptions(options.rememberSession),
  });
}

export function clearAuthCookies(response: NextResponse) {
  const expiredCookie = {
    value: "",
    ...getBaseCookieOptions(),
    expires: new Date(0),
  };

  response.cookies.set({
    name: AUTH_TOKEN_COOKIE,
    ...expiredCookie,
  });
  response.cookies.set({
    name: AUTH_ROLE_COOKIE,
    ...expiredCookie,
  });
  response.cookies.set({
    name: AUTH_SESSION_PERSISTENCE_COOKIE,
    ...expiredCookie,
  });
  response.cookies.set({
    name: PASSWORD_CHANGE_REQUIRED_COOKIE,
    ...expiredCookie,
  });
}

export function createUnauthorizedAuthResponse(message: string) {
  const response = NextResponse.json(
    { error: message },
    { status: 401 },
  );

  clearAuthCookies(response);
  return response;
}
