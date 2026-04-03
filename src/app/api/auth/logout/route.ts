import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth/route-auth";

export async function POST() {
  const response = NextResponse.json({
    ok: true,
    redirectTo: "/login",
  });

  clearAuthCookies(response);

  return response;
}
