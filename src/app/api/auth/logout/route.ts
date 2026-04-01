import { NextResponse } from "next/server";
import {
  AUTH_ROLE_COOKIE,
  AUTH_TOKEN_COOKIE,
  PASSWORD_CHANGE_REQUIRED_COOKIE,
} from "@/lib/auth/session";

export async function POST() {
  const response = NextResponse.json({
    ok: true,
    redirectTo: "/login",
  });

  response.cookies.set({
    name: AUTH_TOKEN_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
  response.cookies.set({
    name: AUTH_ROLE_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
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
}
