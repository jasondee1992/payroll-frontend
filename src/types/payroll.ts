import type { PayrollSchedule } from "@/types/employees";
import type { AttendanceCutoffRecord } from "@/types/attendance";

export type PayrollStatus =
  | "Draft"
  | "Open"
  | "Processed"
  | "Scheduled"
  | "Processing"
  | "Completed"
  | "Closed"
  | "Paid"
  | "Needs review"
  | "Calculated"
  | "Under Finance Review"
  | "Approved"
  | "Posted"
  | "Locked";

export interface PayrollPeriod {
  id: string;
  periodName: string;
  startDate: string;
  endDate: string;
  payoutDate: string;
  status: PayrollStatus;
  payrollSchedule?: PayrollSchedule;
}

export interface PayrollRun {
  id: string;
  periodId: string;
  periodName: string;
  payrollGroup: string;
  notes?: string;
  status: PayrollStatus;
  employeeCount: number;
  estimatedGrossPay: string;
  createdBy?: string;
  createdAt?: string;
}

export interface PayrollPeriodApiRecord {
  id: number;
  period_name: string;
  period_start: string;
  period_end: string;
  payout_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollRunApiRecord {
  id: number;
  payroll_period_id: number;
  employee_id: number;
  gross_pay: string;
  total_deductions: string;
  taxable_income: string;
  withholding_tax: string;
  government_deductions: string;
  net_pay: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollCutoffPreviewRecord {
  cutoff: AttendanceCutoffRecord;
  review_deadline_at?: string | null;
  review_window_closed: boolean;
  existing_batch_id?: number | null;
  existing_batch_status?: string | null;
  can_calculate: boolean;
  blocked_reason?: string | null;
}

export interface PayrollAdjustmentRecord {
  id: number;
  payroll_record_id: number;
  category: "earning" | "deduction" | string;
  adjustment_type: string;
  amount: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollRecordRecord {
  id: number;
  payroll_batch_id: number;
  employee_id: number;
  employee_code_snapshot: string;
  employee_name_snapshot: string;
  basic_pay: string;
  leave_pay: string;
  overtime_pay: string;
  night_differential_pay: string;
  other_earnings: string;
  late_deduction: string;
  undertime_deduction: string;
  absence_deduction: string;
  other_deductions: string;
  gross_pay: string;
  total_deductions: string;
  net_pay: string;
  total_work_days: number;
  total_absences: number;
  total_late_minutes: number;
  total_undertime_minutes: number;
  total_overtime_minutes: number;
  total_night_differential_minutes: number;
  attendance_review_status: string;
  attendance_acknowledged_at?: string | null;
  calculation_source_status: string;
  has_unacknowledged_attendance: boolean;
  used_system_computed_attendance: boolean;
  has_missing_attendance_issues: boolean;
  has_unresolved_requests: boolean;
  has_unusual_adjustments: boolean;
  unresolved_request_count: number;
  approved_request_count: number;
  no_employee_response: boolean;
  review_remarks?: string | null;
  adjustments: PayrollAdjustmentRecord[];
  created_at: string;
  updated_at: string;
}

export interface PayrollBatchSummaryRecord {
  id: number;
  cutoff_id: number;
  status: string;
  calculated_by_user_id?: number | null;
  calculated_at?: string | null;
  reviewed_by_user_id?: number | null;
  reviewed_at?: string | null;
  approved_by_user_id?: number | null;
  approved_at?: string | null;
  posted_by_user_id?: number | null;
  posted_at?: string | null;
  remarks?: string | null;
  created_at: string;
  updated_at: string;
  cutoff: AttendanceCutoffRecord;
  record_count: number;
  total_gross_pay: string;
  total_deductions: string;
  total_net_pay: string;
  records_with_flags: number;
  records_using_system_defaults: number;
}

export interface PayrollBatchDetailRecord extends PayrollBatchSummaryRecord {
  records: PayrollRecordRecord[];
}

export interface PayslipRecord {
  id: number;
  payroll_batch_id: number;
  payroll_record_id: number;
  employee_id: number;
  cutoff_start: string;
  cutoff_end: string;
  posted_at?: string | null;
  status: string;
  generated_reference: string;
  payroll_record: PayrollRecordRecord;
  created_at: string;
  updated_at: string;
}

