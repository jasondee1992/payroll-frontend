import { NextRequest, NextResponse } from "next/server";
import { apiEndpoints } from "@/lib/api/endpoints";
import { getApiBaseUrl } from "@/lib/api/config";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/session";

type PayrollBatchRequestBody = {
  payrollPeriodId?: unknown;
  employeeIds?: unknown;
};

type PayrollProcessResult = {
  employeeId: number;
  status: "created" | "skipped" | "failed";
  message: string;
  payrollRunId?: number;
};

function normalizeEmployeeIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0);
}

function getErrorMessage(responseBody: unknown, fallbackMessage: string) {
  if (
    responseBody &&
    typeof responseBody === "object" &&
    "detail" in responseBody &&
    typeof responseBody.detail === "string" &&
    responseBody.detail.trim().length > 0
  ) {
    return responseBody.detail;
  }

  if (typeof responseBody === "string" && responseBody.trim().length > 0) {
    return responseBody;
  }

  return fallbackMessage;
}

export async function POST(request: NextRequest) {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_API_URL is not configured." },
      { status: 500 },
    );
  }

  let body: PayrollBatchRequestBody;

  try {
    body = (await request.json()) as PayrollBatchRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid payroll run payload." },
      { status: 400 },
    );
  }

  const payrollPeriodId = Number(body.payrollPeriodId);
  const employeeIds = normalizeEmployeeIds(body.employeeIds);

  if (!Number.isInteger(payrollPeriodId) || payrollPeriodId <= 0) {
    return NextResponse.json(
      { error: "A valid payroll period is required." },
      { status: 400 },
    );
  }

  if (employeeIds.length === 0) {
    return NextResponse.json(
      { error: "At least one employee must be included in the payroll run." },
      { status: 400 },
    );
  }

  const accessToken = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
  const results: PayrollProcessResult[] = [];

  try {
    for (const employeeId of employeeIds) {
      const backendResponse = await fetch(`${apiBaseUrl}${apiEndpoints.payroll.process}`, {
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
        body: JSON.stringify({
          payroll_period_id: payrollPeriodId,
          employee_id: employeeId,
        }),
      });

      const contentType = backendResponse.headers.get("content-type") ?? "";
      const responseBody = contentType.includes("application/json")
        ? await backendResponse.json()
        : await backendResponse.text();

      if (backendResponse.ok) {
        results.push({
          employeeId,
          status: "created",
          message: "Payroll run created successfully.",
          payrollRunId:
            responseBody &&
            typeof responseBody === "object" &&
            "id" in responseBody &&
            typeof responseBody.id === "number"
              ? responseBody.id
              : undefined,
        });
        continue;
      }

      results.push({
        employeeId,
        status: backendResponse.status === 409 ? "skipped" : "failed",
        message: getErrorMessage(
          responseBody,
          "Unable to process payroll for this employee.",
        ),
      });
    }

    const createdCount = results.filter((result) => result.status === "created").length;
    const skippedCount = results.filter((result) => result.status === "skipped").length;
    const failedCount = results.filter((result) => result.status === "failed").length;

    return NextResponse.json({
      ok: createdCount > 0 && failedCount === 0,
      createdCount,
      skippedCount,
      failedCount,
      results,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the FastAPI backend." },
      { status: 502 },
    );
  }
}
