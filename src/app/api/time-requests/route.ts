import { NextRequest, NextResponse } from "next/server";
import { apiEndpoints } from "@/lib/api/endpoints";
import { getApiBaseUrl } from "@/lib/api/config";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/session";
import { createUnauthorizedAuthResponse } from "@/lib/auth/route-auth";

function getAuthorizationHeader(request: NextRequest): Record<string, string> {
  const accessToken = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return {};
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function GET(request: NextRequest) {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_API_URL is not configured." },
      { status: 500 },
    );
  }

  const backendUrl = new URL(`${apiBaseUrl}${apiEndpoints.timeRequests.list}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    backendUrl.searchParams.set(key, value);
  });

  try {
    const backendResponse = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...getAuthorizationHeader(request),
      },
      cache: "no-store",
    });

    const contentType = backendResponse.headers.get("content-type") ?? "";
    const responseBody = contentType.includes("application/json")
      ? await backendResponse.json()
      : await backendResponse.text();

    if (!backendResponse.ok) {
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
      { error: "Invalid time request payload." },
      { status: 400 },
    );
  }

  try {
    const backendResponse = await fetch(`${apiBaseUrl}${apiEndpoints.timeRequests.list}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...getAuthorizationHeader(request),
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
