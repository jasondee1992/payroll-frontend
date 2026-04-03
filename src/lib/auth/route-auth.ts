import { NextResponse } from "next/server";
import {
  AUTH_ROLE_COOKIE,
  AUTH_TOKEN_COOKIE,
  PASSWORD_CHANGE_REQUIRED_COOKIE,
} from "@/lib/auth/session";

export function clearAuthCookies(response: NextResponse) {
  const expiredCookie = {
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
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
