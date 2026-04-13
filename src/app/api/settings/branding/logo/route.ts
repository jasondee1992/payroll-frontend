import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api/config";
import { parseBrandingRecord, resolveBrandingAssetUrl } from "@/lib/api/branding";
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

  return "Unable to upload the company logo.";
}

export async function POST(request: NextRequest) {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_API_URL is not configured." },
      { status: 500 },
    );
  }

  const accessToken = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid company logo upload payload." },
      { status: 400 },
    );
  }

  const image = formData.get("image");
  if (!(image instanceof File)) {
    return NextResponse.json(
      { error: "Logo image file is required." },
      { status: 400 },
    );
  }

  const backendFormData = new FormData();
  backendFormData.append("image", image, image.name);

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/branding/logo`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: backendFormData,
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

    const branding = parseBrandingRecord(responseBody);

    return NextResponse.json({
      branding,
      assetUrl: resolveBrandingAssetUrl(branding.companyLogoPath),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the FastAPI backend." },
      { status: 502 },
    );
  }
}
