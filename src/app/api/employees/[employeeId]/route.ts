import { NextRequest, NextResponse } from "next/server";
import { apiEndpoints } from "@/lib/api/endpoints";
import { getApiBaseUrl } from "@/lib/api/config";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/session";
import { createUnauthorizedAuthResponse } from "@/lib/auth/route-auth";

type EmployeeUpdatePayload = {
  employee: Record<string, unknown>;
  government_info: Record<string, unknown>;
  salary_profile: Record<string, unknown>;
};

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

  return "Unable to update the employee record.";
}

async function requestBackend(
  url: string,
  method: "POST" | "PUT",
  accessToken: string | undefined,
  body: unknown,
) {
  const response = await fetch(url, {
    method,
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

  const contentType = response.headers.get("content-type") ?? "";
  const responseBody = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  return {
    ok: response.ok,
    status: response.status,
    body: responseBody,
  };
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ employeeId: string }> },
) {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_API_URL is not configured." },
      { status: 500 },
    );
  }

  let body: EmployeeUpdatePayload;

  try {
    body = (await request.json()) as EmployeeUpdatePayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid employee update payload." },
      { status: 400 },
    );
  }

  const { employeeId } = await context.params;
  const accessToken = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;

  try {
    const onboardingUpdateResponse = await requestBackend(
      `${apiBaseUrl}${apiEndpoints.employees.onboardUpdate(employeeId)}`,
      "PUT",
      accessToken,
      body,
    );

    if (!onboardingUpdateResponse.ok) {
      if (onboardingUpdateResponse.status === 401) {
        return createUnauthorizedAuthResponse(
          getBackendErrorMessage(onboardingUpdateResponse.body),
        );
      }

      return NextResponse.json(
        { error: getBackendErrorMessage(onboardingUpdateResponse.body) },
        { status: onboardingUpdateResponse.status },
      );
    }

    return NextResponse.json(onboardingUpdateResponse.body);
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the FastAPI backend." },
      { status: 502 },
    );
  }
}
