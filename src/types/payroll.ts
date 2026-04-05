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

export interface PayrollDeductionBreakdownRecord {
  id: number;
  payroll_record_id: number;
  deduction_code: string;
  deduction_name: string;
  basis_amount: string;
  employee_share: string;
  employer_share: string;
  bracket_id_used?: number | null;
  config_snapshot_json?: string | null;
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
  taxable_income: string;
  rule_set_id_used?: number | null;
  sss_employee: string;
  sss_employer: string;
  philhealth_employee: string;
  philhealth_employer: string;
  pagibig_employee: string;
  pagibig_employer: string;
  withholding_tax: string;
  government_deductions_total: string;
  total_employer_contributions: string;
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
  deduction_snapshot_json?: string | null;
  adjustments: PayrollAdjustmentRecord[];
  deduction_breakdowns: PayrollDeductionBreakdownRecord[];
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

export interface GovernmentDeductionTypeRecord {
  id: number;
  code: string;
  name: string;
  calculation_method: string;
  employee_share_enabled: boolean;
  employer_share_enabled: boolean;
  is_mandatory: boolean;
  created_at: string;
  updated_at: string;
}

export interface GovernmentDeductionTypeConfigRecord {
  id: number;
  rule_set_id: number;
  deduction_type_id: number;
  deduction_type_code: string;
  deduction_type_name: string;
  based_on: string;
  frequency: string;
  rounding_method: string;
  income_floor?: string | null;
  income_ceiling?: string | null;
  employee_share_ratio?: string | null;
  employer_share_ratio?: string | null;
  cap_amount?: string | null;
  threshold_amount?: string | null;
  rate?: string | null;
  rate_employee?: string | null;
  rate_employer?: string | null;
  fixed_employee_amount?: string | null;
  fixed_employer_amount?: string | null;
  formula_expression?: string | null;
  priority_order: number;
  created_at: string;
  updated_at: string;
}

export interface GovernmentDeductionBracketRecord {
  id: number;
  rule_set_id: number;
  deduction_type_id: number;
  deduction_type_code: string;
  deduction_type_name: string;
  min_salary: string;
  max_salary?: string | null;
  base_amount_employee?: string | null;
  base_amount_employer?: string | null;
  fixed_employee_amount?: string | null;
  fixed_employer_amount?: string | null;
  rate_employee?: string | null;
  rate_employer?: string | null;
  min_contribution?: string | null;
  max_contribution?: string | null;
  base_tax?: string | null;
  excess_over?: string | null;
  percent_over_excess?: string | null;
  reference_value?: string | null;
  sequence: number;
  created_at: string;
  updated_at: string;
}

export interface GovernmentDeductionRuleSetSummaryRecord {
  id: number;
  name: string;
  effective_from: string;
  effective_to?: string | null;
  status: string;
  notes?: string | null;
  created_by_user_id?: number | null;
  approved_by_user_id?: number | null;
  created_at: string;
  updated_at: string;
  config_count: number;
  bracket_count: number;
}

export interface GovernmentDeductionRuleSetDetailRecord
  extends GovernmentDeductionRuleSetSummaryRecord {
  configs: GovernmentDeductionTypeConfigRecord[];
  brackets: GovernmentDeductionBracketRecord[];
}

export interface GovernmentDeductionTestResultItemRecord {
  deduction_code: string;
  deduction_name: string;
  basis_amount: string;
  employee_share: string;
  employer_share: string;
  employer_ec: string;
  total_employer_obligation: string;
  total_remittance: string;
  monthly_salary_credit?: string | null;
  bracket_id_used?: number | null;
  config_snapshot: Record<string, unknown>;
}

export interface GovernmentDeductionTestCalculationRecord {
  rule_set_id?: number | null;
  rule_set_name?: string | null;
  taxable_income: string;
  total_employee_deductions: string;
  total_employer_contributions: string;
  items: GovernmentDeductionTestResultItemRecord[];
}

