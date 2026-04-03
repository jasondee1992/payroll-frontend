import { apiClient } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import { createCollectionParser, loadApiResource } from "@/lib/api/resources";
import { getApiErrorMessage } from "@/lib/api/client";
import { handleUnauthorizedClientResponse } from "@/lib/auth/client-auth";
import {
  parseNumericString,
  parseNumber,
  parseRecord,
  parseString,
} from "@/lib/api/parsers";
import type {
  PayrollPeriod,
  PayrollPeriodApiRecord,
  PayrollRunApiRecord,
  PayrollStatus,
} from "@/types/payroll";
import { formatDate } from "@/lib/format";

const PAYROLL_STATUS_MAP: Record<string, PayrollStatus> = {
  draft: "Draft",
  open: "Open",
  processed: "Processed",
  processing: "Processing",
  completed: "Completed",
  closed: "Closed",
  paid: "Paid",
  scheduled: "Scheduled",
  "needs review": "Needs review",
  needs_review: "Needs review",
  review: "Needs review",
};

export function normalizePayrollStatus(value: string): PayrollStatus {
  return PAYROLL_STATUS_MAP[value.trim().toLowerCase()] ?? "Open";
}

export function parsePayrollPeriodRecord(value: unknown): PayrollPeriodApiRecord {
  const record = parseRecord(value, "payroll period");

  return {
    id: parseNumber(record.id, "payrollPeriod.id"),
    period_name: parseString(record.period_name, "payrollPeriod.period_name"),
    period_start: parseString(
      record.period_start,
      "payrollPeriod.period_start",
    ),
    period_end: parseString(record.period_end, "payrollPeriod.period_end"),
    payout_date: parseString(record.payout_date, "payrollPeriod.payout_date"),
    status: parseString(record.status, "payrollPeriod.status"),
    created_at: parseString(record.created_at, "payrollPeriod.created_at"),
    updated_at: parseString(record.updated_at, "payrollPeriod.updated_at"),
  };
}

export function parsePayrollRunRecord(value: unknown): PayrollRunApiRecord {
  const record = parseRecord(value, "payroll run");

  return {
    id: parseNumber(record.id, "payrollRun.id"),
    payroll_period_id: parseNumber(
      record.payroll_period_id,
      "payrollRun.payroll_period_id",
    ),
    employee_id: parseNumber(record.employee_id, "payrollRun.employee_id"),
    gross_pay: parseNumericString(record.gross_pay, "payrollRun.gross_pay"),
    total_deductions: parseNumericString(
      record.total_deductions,
      "payrollRun.total_deductions",
    ),
    taxable_income: parseNumericString(
      record.taxable_income,
      "payrollRun.taxable_income",
    ),
    withholding_tax: parseNumericString(
      record.withholding_tax,
      "payrollRun.withholding_tax",
    ),
    government_deductions: parseNumericString(
      record.government_deductions,
      "payrollRun.government_deductions",
    ),
    net_pay: parseNumericString(record.net_pay, "payrollRun.net_pay"),
    status: parseString(record.status, "payrollRun.status"),
    created_at: parseString(record.created_at, "payrollRun.created_at"),
    updated_at: parseString(record.updated_at, "payrollRun.updated_at"),
  };
}

const parsePayrollPeriodsResponse = createCollectionParser({
  label: "payroll periods",
  parseItem: (record: unknown) => parsePayrollPeriodRecord(record),
});

const parsePayrollRunsResponse = createCollectionParser({
  label: "payroll runs",
  parseItem: (record: unknown) => parsePayrollRunRecord(record),
});

export function mapPayrollPeriod(record: PayrollPeriodApiRecord): PayrollPeriod {
  return {
    id: String(record.id),
    periodName: record.period_name,
    startDate: formatDate(record.period_start),
    endDate: formatDate(record.period_end),
    payoutDate: formatDate(record.payout_date),
    status: normalizePayrollStatus(record.status),
  };
}

export type CreatePayrollPeriodPayload = {
  periodName: string;
  periodStart: string;
  periodEnd: string;
  payoutDate: string;
  status: "draft" | "open" | "processed" | "closed";
};

export type RunPayrollBatchPayload = {
  payrollPeriodId: number;
  employeeIds: number[];
};

export type RunPayrollBatchResult = {
  ok: boolean;
  createdCount: number;
  skippedCount: number;
  failedCount: number;
  results: Array<{
    employeeId: number;
    status: "created" | "skipped" | "failed";
    message: string;
    payrollRunId?: number;
  }>;
};

export async function getPayrollPeriodRecords() {
  return apiClient.get<PayrollPeriodApiRecord[], PayrollPeriodApiRecord[]>(
    apiEndpoints.payroll.periods,
    {
      parser: parsePayrollPeriodsResponse,
    },
  );
}

export async function getPayrollPeriods() {
  const records = await getPayrollPeriodRecords();
  return records.map((record) => mapPayrollPeriod(record));
}

export async function getPayrollRunRecords() {
  return apiClient.get<PayrollRunApiRecord[], PayrollRunApiRecord[]>(
    apiEndpoints.payroll.runs,
    {
      parser: parsePayrollRunsResponse,
    },
  );
}

function getPayrollActionErrorMessage(responseBody: unknown) {
  return getApiErrorMessage(responseBody, "Unable to complete the payroll action.");
}

export async function createPayrollPeriod(payload: CreatePayrollPeriodPayload) {
  const response = await fetch("/api/payroll/periods", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      period_name: payload.periodName,
      period_start: payload.periodStart,
      period_end: payload.periodEnd,
      payout_date: payload.payoutDate,
      status: payload.status,
    }),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const responseBody = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (await handleUnauthorizedClientResponse(response)) {
    throw new Error("Your session has expired. Redirecting to login.");
  }

  if (!response.ok) {
    throw new Error(getPayrollActionErrorMessage(responseBody));
  }

  return parsePayrollPeriodRecord(responseBody);
}

export async function runPayrollBatch(payload: RunPayrollBatchPayload) {
  const response = await fetch("/api/payroll/runs/process", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const responseBody = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (await handleUnauthorizedClientResponse(response)) {
    throw new Error("Your session has expired. Redirecting to login.");
  }

  if (!response.ok) {
    throw new Error(getPayrollActionErrorMessage(responseBody));
  }

  const record = parseRecord(responseBody, "payroll batch run response");

  return {
    ok: Boolean(record.ok),
    createdCount: parseNumber(record.createdCount, "payrollBatch.createdCount"),
    skippedCount: parseNumber(record.skippedCount, "payrollBatch.skippedCount"),
    failedCount: parseNumber(record.failedCount, "payrollBatch.failedCount"),
    results: Array.isArray(record.results)
      ? record.results.map((item, index) => {
          const resultRecord = parseRecord(item, `payrollBatch.results[${index}]`);

          return {
            employeeId: parseNumber(
              resultRecord.employeeId,
              `payrollBatch.results[${index}].employeeId`,
            ),
            status: parseString(
              resultRecord.status,
              `payrollBatch.results[${index}].status`,
            ) as "created" | "skipped" | "failed",
            message: parseString(
              resultRecord.message,
              `payrollBatch.results[${index}].message`,
            ),
            payrollRunId:
              resultRecord.payrollRunId == null
                ? undefined
                : parseNumber(
                    resultRecord.payrollRunId,
                    `payrollBatch.results[${index}].payrollRunId`,
                  ),
          };
        })
      : [],
  } satisfies RunPayrollBatchResult;
}

export async function getPayrollPeriodsResource() {
  return loadApiResource(() => getPayrollPeriods(), {
    fallbackData: [],
    errorMessage: "Unable to load payroll periods from the backend.",
  });
}

export async function getPayrollPeriodRecordsResource() {
  return loadApiResource(() => getPayrollPeriodRecords(), {
    fallbackData: [],
    errorMessage: "Unable to load payroll periods from the backend.",
  });
}

export async function getPayrollRunRecordsResource() {
  return loadApiResource(() => getPayrollRunRecords(), {
    fallbackData: [],
    errorMessage: "Unable to load payroll runs from the backend.",
  });
}
