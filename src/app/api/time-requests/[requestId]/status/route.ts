import { NextRequest, NextResponse } from "next/server";
import { apiEndpoints } from "@/lib/api/endpoints";
import { getApiBaseUrl } from "@/lib/api/config";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/session";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ requestId: string }> },
) {
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
      { error: "Invalid time request status payload." },
      { status: 400 },
    );
  }

  const accessToken = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
  const { requestId } = await context.params;

  try {
    const backendResponse = await fetch(
      `${apiBaseUrl}${apiEndpoints.timeRequests.status(requestId)}`,
      {
        method: "PATCH",
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
      },
    );

    const contentType = backendResponse.headers.get("content-type") ?? "";
    const responseBody = contentType.includes("application/json")
      ? await backendResponse.json()
      : await backendResponse.text();

    if (!backendResponse.ok) {
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
