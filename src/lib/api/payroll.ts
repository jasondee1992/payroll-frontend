import { apiClient, getApiErrorMessage } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import { parseAttendanceCutoffRecord } from "@/lib/api/attendance";
import {
  createCollectionParser,
  loadApiResource,
} from "@/lib/api/resources";
import { handleUnauthorizedClientResponse } from "@/lib/auth/client-auth";
import {
  parseBoolean,
  parseCollection,
  parseNumber,
  parseNumericString,
  parseRecord,
  parseString,
} from "@/lib/api/parsers";
import type {
  PayslipRecord,
  PayrollAdjustmentRecord,
  PayrollBatchDetailRecord,
  PayrollBatchSummaryRecord,
  PayrollCutoffPreviewRecord,
  PayrollPeriod,
  PayrollPeriodApiRecord,
  PayrollRecordRecord,
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
  calculated: "Calculated",
  "needs review": "Needs review",
  needs_review: "Needs review",
  review: "Needs review",
  under_finance_review: "Under Finance Review",
  approved: "Approved",
  posted: "Posted",
  locked: "Locked",
};

function parseOptionalString(value: unknown, label: string) {
  return parseString(value, label, { optional: true }) ?? null;
}

function parseOptionalNumber(value: unknown, label: string) {
  if (value == null) {
    return null;
  }

  return parseNumber(value, label);
}

export function normalizePayrollStatus(value: string): PayrollStatus {
  return PAYROLL_STATUS_MAP[value.trim().toLowerCase()] ?? "Open";
}

export function parsePayrollPeriodRecord(value: unknown): PayrollPeriodApiRecord {
  const record = parseRecord(value, "payroll period");

  return {
    id: parseNumber(record.id, "payrollPeriod.id"),
    period_name: parseString(record.period_name, "payrollPeriod.period_name"),
    period_start: parseString(record.period_start, "payrollPeriod.period_start"),
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

export function parsePayrollAdjustmentRecord(value: unknown): PayrollAdjustmentRecord {
  const record = parseRecord(value, "payroll adjustment");

  return {
    id: parseNumber(record.id, "payrollAdjustment.id"),
    payroll_record_id: parseNumber(
      record.payroll_record_id,
      "payrollAdjustment.payroll_record_id",
    ),
    category: parseString(record.category, "payrollAdjustment.category"),
    adjustment_type: parseString(
      record.adjustment_type,
      "payrollAdjustment.adjustment_type",
    ),
    amount: parseNumericString(record.amount, "payrollAdjustment.amount"),
    description: parseString(record.description, "payrollAdjustment.description"),
    created_at: parseString(record.created_at, "payrollAdjustment.created_at"),
    updated_at: parseString(record.updated_at, "payrollAdjustment.updated_at"),
  };
}

export function parsePayrollRecordRecord(value: unknown): PayrollRecordRecord {
  const record = parseRecord(value, "payroll record");

  return {
    id: parseNumber(record.id, "payrollRecord.id"),
    payroll_batch_id: parseNumber(
      record.payroll_batch_id,
      "payrollRecord.payroll_batch_id",
    ),
    employee_id: parseNumber(record.employee_id, "payrollRecord.employee_id"),
    employee_code_snapshot: parseString(
      record.employee_code_snapshot,
      "payrollRecord.employee_code_snapshot",
    ),
    employee_name_snapshot: parseString(
      record.employee_name_snapshot,
      "payrollRecord.employee_name_snapshot",
    ),
    basic_pay: parseNumericString(record.basic_pay, "payrollRecord.basic_pay"),
    leave_pay: parseNumericString(record.leave_pay, "payrollRecord.leave_pay"),
    overtime_pay: parseNumericString(record.overtime_pay, "payrollRecord.overtime_pay"),
    night_differential_pay: parseNumericString(
      record.night_differential_pay,
      "payrollRecord.night_differential_pay",
    ),
    other_earnings: parseNumericString(
      record.other_earnings,
      "payrollRecord.other_earnings",
    ),
    late_deduction: parseNumericString(
      record.late_deduction,
      "payrollRecord.late_deduction",
    ),
    undertime_deduction: parseNumericString(
      record.undertime_deduction,
      "payrollRecord.undertime_deduction",
    ),
    absence_deduction: parseNumericString(
      record.absence_deduction,
      "payrollRecord.absence_deduction",
    ),
    other_deductions: parseNumericString(
      record.other_deductions,
      "payrollRecord.other_deductions",
    ),
    gross_pay: parseNumericString(record.gross_pay, "payrollRecord.gross_pay"),
    total_deductions: parseNumericString(
      record.total_deductions,
      "payrollRecord.total_deductions",
    ),
    net_pay: parseNumericString(record.net_pay, "payrollRecord.net_pay"),
    total_work_days: parseNumber(record.total_work_days, "payrollRecord.total_work_days"),
    total_absences: parseNumber(record.total_absences, "payrollRecord.total_absences"),
    total_late_minutes: parseNumber(
      record.total_late_minutes,
      "payrollRecord.total_late_minutes",
    ),
    total_undertime_minutes: parseNumber(
      record.total_undertime_minutes,
      "payrollRecord.total_undertime_minutes",
    ),
    total_overtime_minutes: parseNumber(
      record.total_overtime_minutes,
      "payrollRecord.total_overtime_minutes",
    ),
    total_night_differential_minutes: parseNumber(
      record.total_night_differential_minutes,
      "payrollRecord.total_night_differential_minutes",
    ),
    attendance_review_status: parseString(
      record.attendance_review_status,
      "payrollRecord.attendance_review_status",
    ),
    attendance_acknowledged_at: parseOptionalString(
      record.attendance_acknowledged_at,
      "payrollRecord.attendance_acknowledged_at",
    ),
    calculation_source_status: parseString(
      record.calculation_source_status,
      "payrollRecord.calculation_source_status",
    ),
    has_unacknowledged_attendance: parseBoolean(
      record.has_unacknowledged_attendance,
      "payrollRecord.has_unacknowledged_attendance",
    ),
    used_system_computed_attendance: parseBoolean(
      record.used_system_computed_attendance,
      "payrollRecord.used_system_computed_attendance",
    ),
    has_missing_attendance_issues: parseBoolean(
      record.has_missing_attendance_issues,
      "payrollRecord.has_missing_attendance_issues",
    ),
    has_unresolved_requests: parseBoolean(
      record.has_unresolved_requests,
      "payrollRecord.has_unresolved_requests",
    ),
    has_unusual_adjustments: parseBoolean(
      record.has_unusual_adjustments,
      "payrollRecord.has_unusual_adjustments",
    ),
    unresolved_request_count: parseNumber(
      record.unresolved_request_count,
      "payrollRecord.unresolved_request_count",
    ),
    approved_request_count: parseNumber(
      record.approved_request_count,
      "payrollRecord.approved_request_count",
    ),
    no_employee_response: parseBoolean(
      record.no_employee_response,
      "payrollRecord.no_employee_response",
    ),
    review_remarks: parseOptionalString(
      record.review_remarks,
      "payrollRecord.review_remarks",
    ),
    adjustments: parseCollection(
      record.adjustments ?? [],
      (item) => parsePayrollAdjustmentRecord(item),
      "payroll record adjustments",
    ),
    created_at: parseString(record.created_at, "payrollRecord.created_at"),
    updated_at: parseString(record.updated_at, "payrollRecord.updated_at"),
  };
}

export function parsePayrollBatchSummaryRecord(value: unknown): PayrollBatchSummaryRecord {
  const record = parseRecord(value, "payroll batch");

  return {
    id: parseNumber(record.id, "payrollBatch.id"),
    cutoff_id: parseNumber(record.cutoff_id, "payrollBatch.cutoff_id"),
    status: parseString(record.status, "payrollBatch.status"),
    calculated_by_user_id: parseOptionalNumber(
      record.calculated_by_user_id,
      "payrollBatch.calculated_by_user_id",
    ),
    calculated_at: parseOptionalString(
      record.calculated_at,
      "payrollBatch.calculated_at",
    ),
    reviewed_by_user_id: parseOptionalNumber(
      record.reviewed_by_user_id,
      "payrollBatch.reviewed_by_user_id",
    ),
    reviewed_at: parseOptionalString(record.reviewed_at, "payrollBatch.reviewed_at"),
    approved_by_user_id: parseOptionalNumber(
      record.approved_by_user_id,
      "payrollBatch.approved_by_user_id",
    ),
    approved_at: parseOptionalString(record.approved_at, "payrollBatch.approved_at"),
    posted_by_user_id: parseOptionalNumber(
      record.posted_by_user_id,
      "payrollBatch.posted_by_user_id",
    ),
    posted_at: parseOptionalString(record.posted_at, "payrollBatch.posted_at"),
    remarks: parseOptionalString(record.remarks, "payrollBatch.remarks"),
    created_at: parseString(record.created_at, "payrollBatch.created_at"),
    updated_at: parseString(record.updated_at, "payrollBatch.updated_at"),
    cutoff: parseAttendanceCutoffRecord(record.cutoff),
    record_count: parseNumber(record.record_count, "payrollBatch.record_count"),
    total_gross_pay: parseNumericString(
      record.total_gross_pay,
      "payrollBatch.total_gross_pay",
    ),
    total_deductions: parseNumericString(
      record.total_deductions,
      "payrollBatch.total_deductions",
    ),
    total_net_pay: parseNumericString(
      record.total_net_pay,
      "payrollBatch.total_net_pay",
    ),
    records_with_flags: parseNumber(
      record.records_with_flags,
      "payrollBatch.records_with_flags",
    ),
    records_using_system_defaults: parseNumber(
      record.records_using_system_defaults,
      "payrollBatch.records_using_system_defaults",
    ),
  };
}

export function parsePayrollBatchDetailRecord(value: unknown): PayrollBatchDetailRecord {
  const record = parseRecord(value, "payroll batch detail");
  const summary = parsePayrollBatchSummaryRecord(record);

  return {
    ...summary,
    records: parseCollection(
      record.records ?? [],
      (item) => parsePayrollRecordRecord(item),
      "payroll batch records",
    ),
  };
}

export function parsePayrollCutoffPreviewRecord(value: unknown): PayrollCutoffPreviewRecord {
  const record = parseRecord(value, "payroll cutoff preview");

  return {
    cutoff: parseAttendanceCutoffRecord(record.cutoff),
    review_deadline_at: parseOptionalString(
      record.review_deadline_at,
      "payrollCutoffPreview.review_deadline_at",
    ),
    review_window_closed: parseBoolean(
      record.review_window_closed,
      "payrollCutoffPreview.review_window_closed",
    ),
    existing_batch_id: parseOptionalNumber(
      record.existing_batch_id,
      "payrollCutoffPreview.existing_batch_id",
    ),
    existing_batch_status: parseOptionalString(
      record.existing_batch_status,
      "payrollCutoffPreview.existing_batch_status",
    ),
    can_calculate: parseBoolean(
      record.can_calculate,
      "payrollCutoffPreview.can_calculate",
    ),
    blocked_reason: parseOptionalString(
      record.blocked_reason,
      "payrollCutoffPreview.blocked_reason",
    ),
  };
}

export function parsePayslipRecord(value: unknown): PayslipRecord {
  const record = parseRecord(value, "payslip");

  return {
    id: parseNumber(record.id, "payslip.id"),
    payroll_batch_id: parseNumber(record.payroll_batch_id, "payslip.payroll_batch_id"),
    payroll_record_id: parseNumber(
      record.payroll_record_id,
      "payslip.payroll_record_id",
    ),
    employee_id: parseNumber(record.employee_id, "payslip.employee_id"),
    cutoff_start: parseString(record.cutoff_start, "payslip.cutoff_start"),
    cutoff_end: parseString(record.cutoff_end, "payslip.cutoff_end"),
    posted_at: parseOptionalString(record.posted_at, "payslip.posted_at"),
    status: parseString(record.status, "payslip.status"),
    generated_reference: parseString(
      record.generated_reference,
      "payslip.generated_reference",
    ),
    payroll_record: parsePayrollRecordRecord(record.payroll_record),
    created_at: parseString(record.created_at, "payslip.created_at"),
    updated_at: parseString(record.updated_at, "payslip.updated_at"),
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

export type PayrollBatchRemarksPayload = {
  remarks?: string;
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
  return getApiErrorMessage(
    responseBody,
    "Unable to complete the payroll action.",
  );
}

async function requestPayrollProxy<T>(
  path: string,
  options: {
    method?: "GET" | "POST";
    body?: unknown;
    parser: (value: unknown) => T;
  },
) {
  const response = await fetch(`/api/payroll${path}`, {
    method: options.method ?? "GET",
    headers:
      options.body === undefined
        ? {
            Accept: "application/json",
          }
        : {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
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

  return options.parser(responseBody);
}

async function requestPayrollCollection<T>(
  path: string,
  parseItem: (value: unknown) => T,
) {
  return requestPayrollProxy(path, {
    parser: (value) => parseCollection(value, (item) => parseItem(item), path),
  });
}

export async function getPayrollCutoffPreviews() {
  return requestPayrollCollection("/cutoffs", parsePayrollCutoffPreviewRecord);
}

export async function getPayrollBatches() {
  return requestPayrollCollection("/batches", parsePayrollBatchSummaryRecord);
}

export async function getPayrollBatchDetail(batchId: number) {
  return requestPayrollProxy(`/batches/${batchId}`, {
    parser: parsePayrollBatchDetailRecord,
  });
}

export async function calculatePayrollBatch(payload: {
  cutoffId: number;
  remarks?: string;
}) {
  return requestPayrollProxy("/batches/calculate", {
    method: "POST",
    body: {
      cutoff_id: payload.cutoffId,
      remarks: payload.remarks?.trim() || undefined,
    },
    parser: parsePayrollBatchDetailRecord,
  });
}

export async function recalculatePayrollBatch(
  batchId: number,
  payload: PayrollBatchRemarksPayload = {},
) {
  return requestPayrollProxy(`/batches/${batchId}/recalculate`, {
    method: "POST",
    body: {
      remarks: payload.remarks?.trim() || undefined,
    },
    parser: parsePayrollBatchDetailRecord,
  });
}

export async function approvePayrollBatch(
  batchId: number,
  payload: PayrollBatchRemarksPayload = {},
) {
  return requestPayrollProxy(`/batches/${batchId}/approve`, {
    method: "POST",
    body: {
      remarks: payload.remarks?.trim() || undefined,
    },
    parser: parsePayrollBatchDetailRecord,
  });
}

export async function postPayrollBatch(
  batchId: number,
  payload: PayrollBatchRemarksPayload = {},
) {
  return requestPayrollProxy(`/batches/${batchId}/post`, {
    method: "POST",
    body: {
      remarks: payload.remarks?.trim() || undefined,
    },
    parser: parsePayrollBatchDetailRecord,
  });
}

export async function getPayrollRecordDetail(recordId: number) {
  return requestPayrollProxy(`/records/${recordId}`, {
    parser: parsePayrollRecordRecord,
  });
}

export async function getPayslips() {
  return requestPayrollCollection("/payslips", parsePayslipRecord);
}

export async function getPayslipDetail(payslipId: number) {
  return requestPayrollProxy(`/payslips/${payslipId}`, {
    parser: parsePayslipRecord,
  });
}

export async function getMyPayslips() {
  return requestPayrollCollection("/me/payslips", parsePayslipRecord);
}

export async function getMyPayslipDetail(payslipId: number) {
  return requestPayrollProxy(`/me/payslips/${payslipId}`, {
    parser: parsePayslipRecord,
  });
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
          const resultRecord = parseRecord(
            item,
            `payrollBatch.results[${index}]`,
          );

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
