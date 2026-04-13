import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api/config";
import { parseBrandingRecord } from "@/lib/api/branding";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/session";
import { createUnauthorizedAuthResponse } from "@/lib/auth/route-auth";

function getBackendErrorMessage(responseBody: unknown) {
  if (
    responseBody &&
    typeof responseBody === "object" &&
    !Array.isArray(responseBody)
  ) {
    if ("detail" in responseBody && typeof responseBody.detail === "string") {
      return responseBody.detail;
    }

    if ("error" in responseBody && typeof responseBody.error === "string") {
      return responseBody.error;
    }
  }

  if (typeof responseBody === "string" && responseBody.trim().length > 0) {
    return responseBody;
  }

  return "Unable to update branding settings.";
}

export async function PUT(request: NextRequest) {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_API_URL is not configured." },
      { status: 500 },
    );
  }

  let body: { companyName?: unknown };

  try {
    body = (await request.json()) as { companyName?: unknown };
  } catch {
    return NextResponse.json(
      { error: "Invalid branding payload." },
      { status: 400 },
    );
  }

  const accessToken = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/branding`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        company_name:
          typeof body.companyName === "string" ? body.companyName.trim() : "",
      }),
    });

    const contentType = response.headers.get("content-type") ?? "";
    const responseBody = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      if (response.status === 401) {
        return createUnauthorizedAuthResponse(getBackendErrorMessage(responseBody));
      }

      return NextResponse.json(
        { error: getBackendErrorMessage(responseBody) },
        { status: response.status },
      );
    }

    return NextResponse.json({
      branding: parseBrandingRecord(responseBody),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the FastAPI backend." },
      { status: 502 },
    );
  }
}
