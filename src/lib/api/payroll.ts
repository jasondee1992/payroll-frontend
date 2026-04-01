import { apiClient } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import { createCollectionParser, loadApiResource } from "@/lib/api/resources";
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
