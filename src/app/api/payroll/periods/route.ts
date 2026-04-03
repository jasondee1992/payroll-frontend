import { NextRequest, NextResponse } from "next/server";
import { apiEndpoints } from "@/lib/api/endpoints";
import { getApiBaseUrl } from "@/lib/api/config";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/session";
import { createUnauthorizedAuthResponse } from "@/lib/auth/route-auth";

export async function POST(request: NextRequest) {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_API_URL is not configured." },
      { status: 500 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid payroll period payload." },
      { status: 400 },
    );
  }

  const accessToken = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;

  try {
    const backendResponse = await fetch(`${apiBaseUrl}${apiEndpoints.payroll.periods}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : {}),
      },
      cache: "no-store",
      body: JSON.stringify(body),
    });

    const contentType = backendResponse.headers.get("content-type") ?? "";
    const responseBody = contentType.includes("application/json")
      ? await backendResponse.json()
      : await backendResponse.text();

    if (!backendResponse.ok) {
      if (backendResponse.status === 401) {
        return createUnauthorizedAuthResponse(
          responseBody &&
            typeof responseBody === "object" &&
            "detail" in responseBody &&
            typeof responseBody.detail === "string"
            ? responseBody.detail
            : typeof responseBody === "string" && responseBody.trim().length > 0
              ? responseBody
              : "Your session is no longer valid.",
        );
      }

      if (
        responseBody &&
        typeof responseBody === "object" &&
        "detail" in responseBody &&
        typeof responseBody.detail === "string"
      ) {
        return NextResponse.json(
          { error: responseBody.detail },
          { status: backendResponse.status },
        );
      }

      return NextResponse.json(
        {
          error:
            typeof responseBody === "string" && responseBody.trim().length > 0
              ? responseBody
              : "Unable to create payroll period.",
        },
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
