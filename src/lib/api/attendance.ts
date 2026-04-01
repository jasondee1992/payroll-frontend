import { apiClient } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import { createCollectionParser, loadApiResource } from "@/lib/api/resources";
import {
  parseBoolean,
  parseNumber,
  parseRecord,
  parseString,
} from "@/lib/api/parsers";
import type { AttendanceApiRecord } from "@/types/attendance";

export function parseAttendanceRecord(value: unknown): AttendanceApiRecord {
  const record = parseRecord(value, "attendance log");

  return {
    id: parseNumber(record.id, "attendance.id"),
    employee_id: parseNumber(record.employee_id, "attendance.employee_id"),
    work_date: parseString(record.work_date, "attendance.work_date"),
    time_in: parseString(record.time_in, "attendance.time_in", {
      optional: true,
    }),
    time_out: parseString(record.time_out, "attendance.time_out", {
      optional: true,
    }),
    late_minutes: parseNumber(record.late_minutes, "attendance.late_minutes"),
    undertime_minutes: parseNumber(
      record.undertime_minutes,
      "attendance.undertime_minutes",
    ),
    overtime_minutes: parseNumber(
      record.overtime_minutes,
      "attendance.overtime_minutes",
    ),
    absence_flag: parseBoolean(record.absence_flag, "attendance.absence_flag"),
    remarks: parseString(record.remarks, "attendance.remarks", {
      optional: true,
    }),
    created_at: parseString(record.created_at, "attendance.created_at"),
    updated_at: parseString(record.updated_at, "attendance.updated_at"),
  };
}

const parseAttendanceResponse = createCollectionParser({
  label: "attendance logs",
  parseItem: (record: unknown) => parseAttendanceRecord(record),
});

export async function getAttendanceRecords() {
  return apiClient.get<AttendanceApiRecord[], AttendanceApiRecord[]>(
    apiEndpoints.attendance.list,
    {
      parser: parseAttendanceResponse,
    },
  );
}

export async function getAttendanceRecordsResource() {
  return loadApiResource(() => getAttendanceRecords(), {
    fallbackData: [],
    errorMessage: "Unable to load attendance data from the backend.",
  });
}
