export type EmployeeLoanDeductionSchedule =
  | "first_cutoff"
  | "second_cutoff"
  | "every_cutoff";

export type EmployeeLoanDeductionMode = "fixed_amount" | "split_amount";

export type EmployeeLoanStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "completed"
  | "stopped"
  | "cancelled";

export interface LoanTypeApiRecord {
  id: number;
  provider: string;
  code: string;
  name: string;
  description?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeLoanDeductionApiRecord {
  id: number;
  employee_loan_id: number;
  payroll_batch_id: number;
  attendance_cutoff_id: number;
  deduction_date: string;
  deducted_amount: string;
  installment_number: number;
  remarks?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeLoanApiRecord {
  id: number;
  employee_id: number;
  employee_code: string;
  employee_name: string;
  loan_type_id: number;
  loan_type_code: string;
  loan_type_name: string;
  provider: string;
  loan_name: string;
  start_date: string;
  monthly_deduction: string;
  term_months: number;
  deduction_schedule: EmployeeLoanDeductionSchedule;
  deduction_mode: EmployeeLoanDeductionMode;
  per_cutoff_amount?: string | null;
  total_loan_amount?: string | null;
  total_deducted_amount: string;
  payments_made_count: number;
  remaining_terms: number;
  remaining_balance?: string | null;
  status: EmployeeLoanStatus;
  is_auto_stop_when_fully_paid: boolean;
  remarks?: string | null;
  created_by_user_id?: number | null;
  updated_by_user_id?: number | null;
  estimated_completion_label?: string | null;
  deductions: EmployeeLoanDeductionApiRecord[];
  created_at: string;
  updated_at: string;
}

export type EmployeeLoanCreatePayload = {
  loan_type_id: number;
  provider: string;
  loan_name?: string | null;
  start_date: string;
  monthly_deduction: number;
  term_months: number;
  deduction_schedule: EmployeeLoanDeductionSchedule;
  deduction_mode: EmployeeLoanDeductionMode;
  per_cutoff_amount?: number | null;
  total_loan_amount?: number | null;
  remaining_balance?: number | null;
  status: EmployeeLoanStatus;
  is_auto_stop_when_fully_paid: boolean;
  remarks?: string | null;
};

export type EmployeeLoanUpdatePayload = Partial<EmployeeLoanCreatePayload>;

export type EmployeeLoanStatusUpdatePayload = {
  status: EmployeeLoanStatus;
  remarks?: string | null;
};
