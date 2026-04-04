import { apiClient } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import { loadApiResource } from "@/lib/api/resources";
import {
  parseBoolean,
  parseCollection,
  parseNumber,
  parseRecord,
  parseString,
} from "@/lib/api/parsers";
import { handleUnauthorizedClientResponse } from "@/lib/auth/client-auth";
import type {
  AttendanceCutoffRecord,
  AttendanceCutoffSummaryRecord,
  AttendanceEmployeeSummaryRecord,
  AttendanceImportBatchRecord,
  AttendanceImportError,
  AttendanceImportPreviewRow,
  AttendanceImportSummaryRecord,
  AttendanceLockResult,
  AttendanceMyReviewRecord,
  AttendanceRecord,
  AttendanceReviewRequestRecord,
  NotificationRecord,
} from "@/types/attendance";

export type LegacyAttendanceLogRecord = {
  id: number;
  employee_id: number;
  work_date: string;
  time_in?: string | null;
  time_out?: string | null;
  late_minutes: number;
  undertime_minutes: number;
  overtime_minutes: number;
  absence_flag: boolean;
  remarks?: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateAttendanceCutoffPayload = {
  cutoff_start: string;
  cutoff_end: string;
};

export type CreateAttendanceReviewRequestPayload = {
  cutoff_id: number;
  attendance_record_id: number;
  request_type: AttendanceReviewRequestRecord["request_type"];
  requested_time_in?: string | null;
  requested_time_out?: string | null;
  requested_overtime_minutes?: number | null;
  requested_undertime_reason?: string | null;
  reason: string;
};

export type AttendanceRequestReviewPayload = {
  remarks?: string | null;
};

function parseOptionalString(value: unknown, label: string) {
  return parseString(value, label, { optional: true }) ?? null;
}

export function parseAttendanceCutoffRecord(value: unknown): AttendanceCutoffRecord {
  const record = parseRecord(value, "attendance cutoff");

  return {
    id: parseNumber(record.id, "attendanceCutoff.id"),
    cutoff_start: parseString(record.cutoff_start, "attendanceCutoff.cutoff_start"),
    cutoff_end: parseString(record.cutoff_end, "attendanceCutoff.cutoff_end"),
    status: parseString(record.status, "attendanceCutoff.status") as AttendanceCutoffRecord["status"],
    uploaded_by_user_id:
      record.uploaded_by_user_id == null
        ? null
        : parseNumber(record.uploaded_by_user_id, "attendanceCutoff.uploaded_by_user_id"),
    uploaded_at: parseOptionalString(record.uploaded_at, "attendanceCutoff.uploaded_at"),
    locked_by_user_id:
      record.locked_by_user_id == null
        ? null
        : parseNumber(record.locked_by_user_id, "attendanceCutoff.locked_by_user_id"),
    locked_at: parseOptionalString(record.locked_at, "attendanceCutoff.locked_at"),
    created_at: parseString(record.created_at, "attendanceCutoff.created_at"),
    updated_at: parseString(record.updated_at, "attendanceCutoff.updated_at"),
  };
}

export function parseAttendanceImportBatchRecord(value: unknown): AttendanceImportBatchRecord {
  const record = parseRecord(value, "attendance import batch");

  return {
    id: parseNumber(record.id, "attendanceImportBatch.id"),
    cutoff_id: parseNumber(record.cutoff_id, "attendanceImportBatch.cutoff_id"),
    file_name: parseString(record.file_name, "attendanceImportBatch.file_name"),
    uploaded_by_user_id: parseNumber(
      record.uploaded_by_user_id,
      "attendanceImportBatch.uploaded_by_user_id",
    ),
    uploaded_at: parseString(record.uploaded_at, "attendanceImportBatch.uploaded_at"),
    total_rows: parseNumber(record.total_rows, "attendanceImportBatch.total_rows"),
    valid_rows: parseNumber(record.valid_rows, "attendanceImportBatch.valid_rows"),
    invalid_rows: parseNumber(record.invalid_rows, "attendanceImportBatch.invalid_rows"),
    employees_affected: parseNumber(
      record.employees_affected,
      "attendanceImportBatch.employees_affected",
    ),
    missing_time_in_rows: parseNumber(
      record.missing_time_in_rows,
      "attendanceImportBatch.missing_time_in_rows",
    ),
    missing_time_out_rows: parseNumber(
      record.missing_time_out_rows,
      "attendanceImportBatch.missing_time_out_rows",
    ),
    unknown_employee_rows: parseNumber(
      record.unknown_employee_rows,
      "attendanceImportBatch.unknown_employee_rows",
    ),
    duplicate_rows: parseNumber(record.duplicate_rows, "attendanceImportBatch.duplicate_rows"),
    created_at: parseString(record.created_at, "attendanceImportBatch.created_at"),
    updated_at: parseString(record.updated_at, "attendanceImportBatch.updated_at"),
  };
}

export function parseAttendanceImportPreviewRow(value: unknown): AttendanceImportPreviewRow {
  const record = parseRecord(value, "attendance import preview row");

  return {
    employee_code: parseString(record.employee_code, "attendanceImportPreview.employee_code"),
    employee_name: parseString(record.employee_name, "attendanceImportPreview.employee_name"),
    attendance_date: parseString(
      record.attendance_date,
      "attendanceImportPreview.attendance_date",
    ),
    time_in: parseOptionalString(record.time_in, "attendanceImportPreview.time_in"),
    time_out: parseOptionalString(record.time_out, "attendanceImportPreview.time_out"),
    late_minutes: parseNumber(record.late_minutes, "attendanceImportPreview.late_minutes"),
    undertime_minutes: parseNumber(
      record.undertime_minutes,
      "attendanceImportPreview.undertime_minutes",
    ),
    overtime_minutes: parseNumber(
      record.overtime_minutes,
      "attendanceImportPreview.overtime_minutes",
    ),
    night_differential_minutes: parseNumber(
      record.night_differential_minutes,
      "attendanceImportPreview.night_differential_minutes",
    ),
    status: parseString(record.status, "attendanceImportPreview.status"),
    remarks: parseOptionalString(record.remarks, "attendanceImportPreview.remarks"),
  };
}

export function parseAttendanceImportError(value: unknown): AttendanceImportError {
  const record = parseRecord(value, "attendance import error");

  return {
    row_number: parseNumber(record.row_number, "attendanceImportError.row_number"),
    employee_identifier: parseOptionalString(
      record.employee_identifier,
      "attendanceImportError.employee_identifier",
    ),
    message: parseString(record.message, "attendanceImportError.message"),
  };
}

export function parseAttendanceRecord(value: unknown): AttendanceRecord {
  const record = parseRecord(value, "attendance record");

  return {
    id: parseNumber(record.id, "attendanceRecord.id"),
    cutoff_id: parseNumber(record.cutoff_id, "attendanceRecord.cutoff_id"),
    employee_id: parseNumber(record.employee_id, "attendanceRecord.employee_id"),
    attendance_date: parseString(record.attendance_date, "attendanceRecord.attendance_date"),
    time_in: parseOptionalString(record.time_in, "attendanceRecord.time_in"),
    time_out: parseOptionalString(record.time_out, "attendanceRecord.time_out"),
    late_minutes: parseNumber(record.late_minutes, "attendanceRecord.late_minutes"),
    undertime_minutes: parseNumber(
      record.undertime_minutes,
      "attendanceRecord.undertime_minutes",
    ),
    overtime_minutes: parseNumber(record.overtime_minutes, "attendanceRecord.overtime_minutes"),
    night_differential_minutes: parseNumber(
      record.night_differential_minutes,
      "attendanceRecord.night_differential_minutes",
    ),
    status: parseString(record.status, "attendanceRecord.status"),
    remarks: parseOptionalString(record.remarks, "attendanceRecord.remarks"),
    source_file_name: parseOptionalString(
      record.source_file_name,
      "attendanceRecord.source_file_name",
    ),
    has_missing_time_in: parseBoolean(
      record.has_missing_time_in,
      "attendanceRecord.has_missing_time_in",
    ),
    has_missing_time_out: parseBoolean(
      record.has_missing_time_out,
      "attendanceRecord.has_missing_time_out",
    ),
    import_batch_id:
      record.import_batch_id == null
        ? null
        : parseNumber(record.import_batch_id, "attendanceRecord.import_batch_id"),
    created_at: parseString(record.created_at, "attendanceRecord.created_at"),
    updated_at: parseString(record.updated_at, "attendanceRecord.updated_at"),
  };
}

export function parseLegacyAttendanceLogRecord(value: unknown): LegacyAttendanceLogRecord {
  const record = parseRecord(value, "legacy attendance log");

  return {
    id: parseNumber(record.id, "legacyAttendance.id"),
    employee_id: parseNumber(record.employee_id, "legacyAttendance.employee_id"),
    work_date: parseString(record.work_date, "legacyAttendance.work_date"),
    time_in: parseOptionalString(record.time_in, "legacyAttendance.time_in"),
    time_out: parseOptionalString(record.time_out, "legacyAttendance.time_out"),
    late_minutes: parseNumber(record.late_minutes, "legacyAttendance.late_minutes"),
    undertime_minutes: parseNumber(
      record.undertime_minutes,
      "legacyAttendance.undertime_minutes",
    ),
    overtime_minutes: parseNumber(
      record.overtime_minutes,
      "legacyAttendance.overtime_minutes",
    ),
    absence_flag: parseBoolean(record.absence_flag, "legacyAttendance.absence_flag"),
    remarks: parseOptionalString(record.remarks, "legacyAttendance.remarks"),
    created_at: parseString(record.created_at, "legacyAttendance.created_at"),
    updated_at: parseString(record.updated_at, "legacyAttendance.updated_at"),
  };
}

export function parseAttendanceEmployeeSummaryRecord(
  value: unknown,
): AttendanceEmployeeSummaryRecord {
  const record = parseRecord(value, "attendance employee summary");

  return {
    employee_id: parseNumber(record.employee_id, "attendanceEmployeeSummary.employee_id"),
    employee_code: parseString(record.employee_code, "attendanceEmployeeSummary.employee_code"),
    employee_name: parseString(record.employee_name, "attendanceEmployeeSummary.employee_name"),
    cutoff_id: parseNumber(record.cutoff_id, "attendanceEmployeeSummary.cutoff_id"),
    total_work_days: parseNumber(
      record.total_work_days,
      "attendanceEmployeeSummary.total_work_days",
    ),
    total_late_minutes: parseNumber(
      record.total_late_minutes,
      "attendanceEmployeeSummary.total_late_minutes",
    ),
    total_undertime_minutes: parseNumber(
      record.total_undertime_minutes,
      "attendanceEmployeeSummary.total_undertime_minutes",
    ),
    total_overtime_minutes: parseNumber(
      record.total_overtime_minutes,
      "attendanceEmployeeSummary.total_overtime_minutes",
    ),
    total_night_differential_minutes: parseNumber(
      record.total_night_differential_minutes,
      "attendanceEmployeeSummary.total_night_differential_minutes",
    ),
    total_absences: parseNumber(record.total_absences, "attendanceEmployeeSummary.total_absences"),
    unresolved_exceptions_count: parseNumber(
      record.unresolved_exceptions_count,
      "attendanceEmployeeSummary.unresolved_exceptions_count",
    ),
    review_status: parseString(record.review_status, "attendanceEmployeeSummary.review_status"),
    acknowledged_at: parseOptionalString(
      record.acknowledged_at,
      "attendanceEmployeeSummary.acknowledged_at",
    ),
  };
}

export function parseAttendanceReviewRequestRecord(
  value: unknown,
): AttendanceReviewRequestRecord {
  const record = parseRecord(value, "attendance review request");

  return {
    id: parseNumber(record.id, "attendanceReviewRequest.id"),
    cutoff_id: parseNumber(record.cutoff_id, "attendanceReviewRequest.cutoff_id"),
    employee_id: parseNumber(record.employee_id, "attendanceReviewRequest.employee_id"),
    attendance_record_id: parseNumber(
      record.attendance_record_id,
      "attendanceReviewRequest.attendance_record_id",
    ),
    submitted_by_user_id: parseNumber(
      record.submitted_by_user_id,
      "attendanceReviewRequest.submitted_by_user_id",
    ),
    reviewed_by_user_id:
      record.reviewed_by_user_id == null
        ? null
        : parseNumber(
            record.reviewed_by_user_id,
            "attendanceReviewRequest.reviewed_by_user_id",
          ),
    reviewed_by_name: parseOptionalString(
      record.reviewed_by_name,
      "attendanceReviewRequest.reviewed_by_name",
    ),
    reporting_manager_id:
      record.reporting_manager_id == null
        ? null
        : parseNumber(
            record.reporting_manager_id,
            "attendanceReviewRequest.reporting_manager_id",
          ),
    employee_code_snapshot: parseString(
      record.employee_code_snapshot,
      "attendanceReviewRequest.employee_code_snapshot",
    ),
    employee_name_snapshot: parseString(
      record.employee_name_snapshot,
      "attendanceReviewRequest.employee_name_snapshot",
    ),
    attendance_date_snapshot: parseString(
      record.attendance_date_snapshot,
      "attendanceReviewRequest.attendance_date_snapshot",
    ),
    request_type: parseString(
      record.request_type,
      "attendanceReviewRequest.request_type",
    ) as AttendanceReviewRequestRecord["request_type"],
    requested_time_in: parseOptionalString(
      record.requested_time_in,
      "attendanceReviewRequest.requested_time_in",
    ),
    requested_time_out: parseOptionalString(
      record.requested_time_out,
      "attendanceReviewRequest.requested_time_out",
    ),
    requested_overtime_minutes:
      record.requested_overtime_minutes == null
        ? null
        : parseNumber(
            record.requested_overtime_minutes,
            "attendanceReviewRequest.requested_overtime_minutes",
          ),
    requested_undertime_reason: parseOptionalString(
      record.requested_undertime_reason,
      "attendanceReviewRequest.requested_undertime_reason",
    ),
    reason: parseString(record.reason, "attendanceReviewRequest.reason"),
    status: parseString(record.status, "attendanceReviewRequest.status") as AttendanceReviewRequestRecord["status"],
    review_remarks: parseOptionalString(
      record.review_remarks,
      "attendanceReviewRequest.review_remarks",
    ),
    reviewed_at: parseOptionalString(
      record.reviewed_at,
      "attendanceReviewRequest.reviewed_at",
    ),
    created_at: parseString(record.created_at, "attendanceReviewRequest.created_at"),
    updated_at: parseString(record.updated_at, "attendanceReviewRequest.updated_at"),
  };
}

export function parseAttendanceMyReviewRecord(value: unknown): AttendanceMyReviewRecord {
  const record = parseRecord(value, "attendance my review");

  return {
    cutoff: parseAttendanceCutoffRecord(record.cutoff),
    summary: parseAttendanceEmployeeSummaryRecord(record.summary),
    records: parseCollection(
      record.records,
      (item) => parseAttendanceRecord(item),
      "attendanceMyReview.records",
    ),
    requests: parseCollection(
      record.requests,
      (item) => parseAttendanceReviewRequestRecord(item),
      "attendanceMyReview.requests",
    ),
    can_submit_requests: parseBoolean(
      record.can_submit_requests,
      "attendanceMyReview.can_submit_requests",
    ),
    can_acknowledge: parseBoolean(
      record.can_acknowledge,
      "attendanceMyReview.can_acknowledge",
    ),
  };
}

export function parseAttendanceCutoffSummaryRecord(
  value: unknown,
): AttendanceCutoffSummaryRecord {
  const record = parseRecord(value, "attendance cutoff summary");

  return {
    cutoff: parseAttendanceCutoffRecord(record.cutoff),
    employee_count: parseNumber(record.employee_count, "attendanceCutoffSummary.employee_count"),
    pending_review_count: parseNumber(
      record.pending_review_count,
      "attendanceCutoffSummary.pending_review_count",
    ),
    reviewed_count: parseNumber(record.reviewed_count, "attendanceCutoffSummary.reviewed_count"),
    pending_request_count: parseNumber(
      record.pending_request_count,
      "attendanceCutoffSummary.pending_request_count",
    ),
    records_with_missing_logs: parseNumber(
      record.records_with_missing_logs,
      "attendanceCutoffSummary.records_with_missing_logs",
    ),
    import_batches: parseCollection(
      record.import_batches,
      (item) => parseAttendanceImportBatchRecord(item),
      "attendanceCutoffSummary.import_batches",
    ),
    employees: parseCollection(
      record.employees,
      (item) => parseAttendanceEmployeeSummaryRecord(item),
      "attendanceCutoffSummary.employees",
    ),
  };
}

export function parseAttendanceImportSummaryRecord(
  value: unknown,
): AttendanceImportSummaryRecord {
  const record = parseRecord(value, "attendance import summary");

  return {
    cutoff: parseAttendanceCutoffRecord(record.cutoff),
    batch: parseAttendanceImportBatchRecord(record.batch),
    total_rows: parseNumber(record.total_rows, "attendanceImportSummary.total_rows"),
    valid_rows: parseNumber(record.valid_rows, "attendanceImportSummary.valid_rows"),
    invalid_rows: parseNumber(record.invalid_rows, "attendanceImportSummary.invalid_rows"),
    employees_affected: parseNumber(
      record.employees_affected,
      "attendanceImportSummary.employees_affected",
    ),
    missing_time_in_rows: parseNumber(
      record.missing_time_in_rows,
      "attendanceImportSummary.missing_time_in_rows",
    ),
    missing_time_out_rows: parseNumber(
      record.missing_time_out_rows,
      "attendanceImportSummary.missing_time_out_rows",
    ),
    unknown_employee_rows: parseNumber(
      record.unknown_employee_rows,
      "attendanceImportSummary.unknown_employee_rows",
    ),
    duplicate_rows: parseNumber(
      record.duplicate_rows,
      "attendanceImportSummary.duplicate_rows",
    ),
    preview_rows: parseCollection(
      record.preview_rows,
      (item) => parseAttendanceImportPreviewRow(item),
      "attendanceImportSummary.preview_rows",
    ),
    invalid_row_details: parseCollection(
      record.invalid_row_details,
      (item) => parseAttendanceImportError(item),
      "attendanceImportSummary.invalid_row_details",
    ),
  };
}

export function parseAttendanceLockResult(value: unknown): AttendanceLockResult {
  const record = parseRecord(value, "attendance lock response");

  return {
    cutoff: parseAttendanceCutoffRecord(record.cutoff),
    locked_summary_count: parseNumber(
      record.locked_summary_count,
      "attendanceLockResult.locked_summary_count",
    ),
  };
}

export function parseNotificationRecord(value: unknown): NotificationRecord {
  const record = parseRecord(value, "notification");

  return {
    id: parseNumber(record.id, "notification.id"),
    notification_type: parseString(record.notification_type, "notification.notification_type"),
    title: parseString(record.title, "notification.title"),
    message: parseString(record.message, "notification.message"),
    href: parseString(record.href, "notification.href"),
    entity_type: parseOptionalString(record.entity_type, "notification.entity_type"),
    entity_id:
      record.entity_id == null
        ? null
        : parseNumber(record.entity_id, "notification.entity_id"),
    is_read: parseBoolean(record.is_read, "notification.is_read"),
    read_at: parseOptionalString(record.read_at, "notification.read_at"),
    created_at: parseString(record.created_at, "notification.created_at"),
    updated_at: parseString(record.updated_at, "notification.updated_at"),
  };
}

async function getResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json")
    ? response.json()
    : response.text();
}

function getErrorMessage(responseBody: unknown) {
  if (
    responseBody &&
    typeof responseBody === "object" &&
    !Array.isArray(responseBody)
  ) {
    if ("error" in responseBody && typeof responseBody.error === "string") {
      return responseBody.error;
    }

    if ("detail" in responseBody && typeof responseBody.detail === "string") {
      return responseBody.detail;
    }
  }

  if (typeof responseBody === "string" && responseBody.trim().length > 0) {
    return responseBody;
  }

  return "Unable to process the attendance request.";
}

async function handleApiResponse<T>(response: Response, parse: (value: unknown) => T) {
  const responseBody = await getResponseBody(response);

  if (await handleUnauthorizedClientResponse(response)) {
    throw new Error("Your session has expired. Redirecting to login.");
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(responseBody));
  }

  return parse(responseBody);
}

function normalizeAttendanceCsvHeaderKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (insideQuotes && line[index + 1] === '"') {
        currentCell += '"';
        index += 1;
        continue;
      }

      insideQuotes = !insideQuotes;
      continue;
    }

    if (character === "," && !insideQuotes) {
      cells.push(currentCell);
      currentCell = "";
      continue;
    }

    currentCell += character;
  }

  cells.push(currentCell);
  return cells;
}

function getFirstNonEmptyCsvDataLine(csvText: string) {
  const lines = csvText.split(/\r?\n/);

  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index].trim().length > 0) {
      return lines[index];
    }
  }

  return null;
}

function escapeCsvCell(value: string) {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function looksLikeEmployeeCode(value: string | undefined) {
  if (!value) {
    return false;
  }

  return /[a-z-]/i.test(value.trim());
}

function toCanonicalAttendanceHeader(header: string, sampleValue?: string) {
  const normalizedHeader = normalizeAttendanceCsvHeaderKey(header);

  switch (normalizedHeader) {
    case "employee code":
      return "employee_code";
    case "employee id":
    case "employee":
      return looksLikeEmployeeCode(sampleValue) ? "employee_code" : "employee_id";
    case "attendance date":
    case "date":
    case "work date":
      return "attendance_date";
    case "time in":
    case "in":
      return "time_in";
    case "time out":
    case "out":
      return "time_out";
    case "remarks":
      return "remarks";
    case "attendance status":
    case "status":
      return "status";
    default:
      return header.trim();
  }
}

function inferAttendanceDateFormat(rows: string[][], attendanceDateColumnIndex: number) {
  let hasDayFirstEvidence = false;
  let hasMonthFirstEvidence = false;

  for (const row of rows) {
    const value = row[attendanceDateColumnIndex]?.trim();
    if (!value) {
      continue;
    }

    const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (!match) {
      continue;
    }

    const firstPart = Number(match[1]);
    const secondPart = Number(match[2]);

    if (firstPart > 12 && secondPart <= 12) {
      hasDayFirstEvidence = true;
    }

    if (secondPart > 12 && firstPart <= 12) {
      hasMonthFirstEvidence = true;
    }
  }

  if (hasDayFirstEvidence && !hasMonthFirstEvidence) {
    return "dd/mm/yyyy";
  }

  if (hasMonthFirstEvidence && !hasDayFirstEvidence) {
    return "mm/dd/yyyy";
  }

  return null;
}

function normalizeAttendanceDateValue(value: string, dateFormat: "dd/mm/yyyy" | "mm/dd/yyyy") {
  const trimmedValue = value.trim();
  const match = trimmedValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);

  if (!match) {
    return trimmedValue;
  }

  const firstPart = Number(match[1]);
  const secondPart = Number(match[2]);
  const yearPart = match[3].length === 2 ? `20${match[3]}` : match[3];
  const monthPart = dateFormat === "dd/mm/yyyy" ? secondPart : firstPart;
  const dayPart = dateFormat === "dd/mm/yyyy" ? firstPart : secondPart;

  return `${yearPart}-${String(monthPart).padStart(2, "0")}-${String(dayPart).padStart(2, "0")}`;
}

async function normalizeAttendanceCsvUploadFile(file: File) {
  const csvText = await file.text();
  const lines = csvText.split(/\r?\n/);
  const headerLine = lines[0];

  if (!headerLine) {
    return file;
  }
  const headerCells = splitCsvLine(headerLine);
  const firstDataLine = getFirstNonEmptyCsvDataLine(csvText);
  const firstDataCells = firstDataLine ? splitCsvLine(firstDataLine) : [];
  const normalizedHeaderCells = headerCells.map((headerCell, index) =>
    toCanonicalAttendanceHeader(headerCell, firstDataCells[index]),
  );
  const parsedRows = lines.slice(1).map((line) => splitCsvLine(line));
  const attendanceDateColumnIndex = normalizedHeaderCells.findIndex(
    (headerCell) => headerCell === "attendance_date",
  );
  const inferredDateFormat =
    attendanceDateColumnIndex >= 0
      ? inferAttendanceDateFormat(parsedRows, attendanceDateColumnIndex)
      : null;

  if (
    inferredDateFormat == null &&
    normalizedHeaderCells.every(
      (headerCell, index) => headerCell === headerCells[index].trim(),
    )
  ) {
    return file;
  }

  const normalizedRows = parsedRows.map((row) =>
    row.map((cell, index) =>
      inferredDateFormat != null && index === attendanceDateColumnIndex
        ? normalizeAttendanceDateValue(cell ?? "", inferredDateFormat)
        : cell ?? "",
    ),
  );
  const normalizedCsvText = [normalizedHeaderCells, ...normalizedRows]
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
    .join(csvText.includes("\r\n") ? "\r\n" : "\n");

  return new File([normalizedCsvText], file.name, {
    type: file.type || "text/csv",
  });
}

export async function getAttendanceCutoffs() {
  const response = await fetch("/api/attendance/cutoffs", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  return handleApiResponse(response, (value) =>
    parseCollection(
      value,
      (item) => parseAttendanceCutoffRecord(item),
      "attendanceCutoffs",
    ),
  );
}

export async function createAttendanceCutoff(payload: CreateAttendanceCutoffPayload) {
  const response = await fetch("/api/attendance/cutoffs", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleApiResponse(response, parseAttendanceCutoffRecord);
}

export async function deleteAttendanceCutoff(cutoffId: number) {
  const response = await fetch(`/api/attendance/cutoffs/${cutoffId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
  });

  return handleApiResponse(response, parseAttendanceCutoffRecord);
}

export async function uploadAttendanceCsv(cutoffId: number, file: File) {
  const normalizedFile = await normalizeAttendanceCsvUploadFile(file);
  const formData = new FormData();
  formData.append("file", normalizedFile);

  const response = await fetch(`/api/attendance/cutoffs/${cutoffId}/upload`, {
    method: "POST",
    body: formData,
  });

  return handleApiResponse(response, parseAttendanceImportSummaryRecord);
}

export async function getAttendanceCutoffSummary(cutoffId: number) {
  const response = await fetch(`/api/attendance/cutoffs/${cutoffId}/summary`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  return handleApiResponse(response, parseAttendanceCutoffSummaryRecord);
}

export async function getMyAttendanceReview(cutoffId?: number | null) {
  const searchParams = new URLSearchParams();
  if (cutoffId != null) {
    searchParams.set("cutoff_id", String(cutoffId));
  }

  const response = await fetch(`/api/attendance/me/review?${searchParams.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  return handleApiResponse(response, parseAttendanceMyReviewRecord);
}

export async function acknowledgeAttendanceReview(cutoffId: number) {
  const response = await fetch("/api/attendance/me/acknowledge", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cutoff_id: cutoffId }),
  });

  return handleApiResponse(response, parseAttendanceMyReviewRecord);
}

export async function createAttendanceReviewRequest(
  payload: CreateAttendanceReviewRequestPayload,
) {
  const response = await fetch("/api/attendance/me/requests", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleApiResponse(response, parseAttendanceReviewRequestRecord);
}

export async function getAttendanceReviewRequests(params?: {
  cutoffId?: number | null;
  status?: string | null;
  employee?: string | null;
}) {
  const searchParams = new URLSearchParams();
  if (params?.cutoffId != null) {
    searchParams.set("cutoff_id", String(params.cutoffId));
  }
  if (params?.status) {
    searchParams.set("status", params.status);
  }
  if (params?.employee) {
    searchParams.set("employee", params.employee);
  }

  const response = await fetch(`/api/attendance/requests?${searchParams.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  return handleApiResponse(response, (value) =>
    parseCollection(
      value,
      (item) => parseAttendanceReviewRequestRecord(item),
      "attendanceReviewRequests",
    ),
  );
}

export async function approveAttendanceReviewRequest(
  requestId: number,
  payload: AttendanceRequestReviewPayload,
) {
  const response = await fetch(`/api/attendance/requests/${requestId}/approve`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleApiResponse(response, parseAttendanceReviewRequestRecord);
}

export async function rejectAttendanceReviewRequest(
  requestId: number,
  payload: AttendanceRequestReviewPayload,
) {
  const response = await fetch(`/api/attendance/requests/${requestId}/reject`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleApiResponse(response, parseAttendanceReviewRequestRecord);
}

export async function lockAttendanceCutoff(cutoffId: number) {
  const response = await fetch(`/api/attendance/cutoffs/${cutoffId}/lock`, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
  });

  return handleApiResponse(response, parseAttendanceLockResult);
}

export async function getNotifications() {
  const response = await fetch("/api/notifications", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  return handleApiResponse(response, (value) =>
    parseCollection(
      value,
      (item) => parseNotificationRecord(item),
      "notifications",
    ),
  );
}

export async function markNotificationAsRead(notificationId: number) {
  const response = await fetch(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ is_read: true }),
  });

  return handleApiResponse(response, parseNotificationRecord);
}

export async function getAttendanceRecords() {
  return apiClient.get<LegacyAttendanceLogRecord[], LegacyAttendanceLogRecord[]>(
    apiEndpoints.attendance.list,
    {
      parser: (value) =>
        parseCollection(
          value,
          (item) => parseLegacyAttendanceLogRecord(item),
          "legacyAttendanceLogs",
        ),
    },
  );
}

export async function getAttendanceRecordsResource() {
  return loadApiResource(() => getAttendanceRecords(), {
    fallbackData: [],
    errorMessage: "Unable to load attendance data from the backend.",
  });
}
