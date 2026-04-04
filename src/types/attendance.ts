export interface AttendanceCutoffRecord {
  id: number;
  cutoff_start: string;
  cutoff_end: string;
  status: "draft" | "under_review" | "approved" | "locked";
  uploaded_by_user_id?: number | null;
  uploaded_at?: string | null;
  locked_by_user_id?: number | null;
  locked_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceImportBatchRecord {
  id: number;
  cutoff_id: number;
  file_name: string;
  uploaded_by_user_id: number;
  uploaded_at: string;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  employees_affected: number;
  missing_time_in_rows: number;
  missing_time_out_rows: number;
  unknown_employee_rows: number;
  duplicate_rows: number;
  created_at: string;
  updated_at: string;
}

export interface AttendanceImportPreviewRow {
  employee_code: string;
  employee_name: string;
  attendance_date: string;
  time_in?: string | null;
  time_out?: string | null;
  late_minutes: number;
  undertime_minutes: number;
  overtime_minutes: number;
  night_differential_minutes: number;
  status: string;
  remarks?: string | null;
}

export interface AttendanceImportError {
  row_number: number;
  employee_identifier?: string | null;
  message: string;
}

export interface AttendanceImportSummaryRecord {
  cutoff: AttendanceCutoffRecord;
  batch: AttendanceImportBatchRecord;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  employees_affected: number;
  missing_time_in_rows: number;
  missing_time_out_rows: number;
  unknown_employee_rows: number;
  duplicate_rows: number;
  preview_rows: AttendanceImportPreviewRow[];
  invalid_row_details: AttendanceImportError[];
}

export interface AttendanceRecord {
  id: number;
  cutoff_id: number;
  employee_id: number;
  attendance_date: string;
  time_in?: string | null;
  time_out?: string | null;
  late_minutes: number;
  undertime_minutes: number;
  overtime_minutes: number;
  night_differential_minutes: number;
  status: string;
  remarks?: string | null;
  source_file_name?: string | null;
  has_missing_time_in: boolean;
  has_missing_time_out: boolean;
  import_batch_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceLog {
  employeeId: string;
  employeeName: string;
  workDate: string;
  timeIn: string;
  timeOut: string;
  lateMinutes: number;
  undertimeMinutes: number;
  overtimeMinutes: number;
  remarks: string;
}

export interface AttendanceEmployeeSummaryRecord {
  employee_id: number;
  employee_code: string;
  employee_name: string;
  cutoff_id: number;
  total_work_days: number;
  total_late_minutes: number;
  total_undertime_minutes: number;
  total_overtime_minutes: number;
  total_night_differential_minutes: number;
  total_absences: number;
  unresolved_exceptions_count: number;
  review_status: string;
  acknowledged_at?: string | null;
}

export interface AttendanceCutoffSummaryRecord {
  cutoff: AttendanceCutoffRecord;
  employee_count: number;
  pending_review_count: number;
  reviewed_count: number;
  pending_request_count: number;
  records_with_missing_logs: number;
  import_batches: AttendanceImportBatchRecord[];
  employees: AttendanceEmployeeSummaryRecord[];
}

export type AttendanceRequestType =
  | "overtime"
  | "undertime-explanation"
  | "missing-time-in"
  | "missing-time-out"
  | "attendance-correction";

export interface AttendanceReviewRequestRecord {
  id: number;
  cutoff_id: number;
  employee_id: number;
  attendance_record_id: number;
  submitted_by_user_id: number;
  reviewed_by_user_id?: number | null;
  reviewed_by_name?: string | null;
  reporting_manager_id?: number | null;
  employee_code_snapshot: string;
  employee_name_snapshot: string;
  attendance_date_snapshot: string;
  request_type: AttendanceRequestType;
  requested_time_in?: string | null;
  requested_time_out?: string | null;
  requested_overtime_minutes?: number | null;
  requested_undertime_reason?: string | null;
  reason: string;
  status: "pending" | "approved" | "rejected";
  review_remarks?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceMyReviewRecord {
  cutoff: AttendanceCutoffRecord;
  summary: AttendanceEmployeeSummaryRecord;
  records: AttendanceRecord[];
  requests: AttendanceReviewRequestRecord[];
  can_submit_requests: boolean;
  can_acknowledge: boolean;
}

export interface AttendanceLockResult {
  cutoff: AttendanceCutoffRecord;
  locked_summary_count: number;
}

export interface NotificationRecord {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  href: string;
  entity_type?: string | null;
  entity_id?: number | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  updated_at: string;
}
