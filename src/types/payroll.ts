import type { PayrollSchedule } from "@/types/employees";

export type PayrollStatus =
  | "Draft"
  | "Open"
  | "Processed"
  | "Scheduled"
  | "Processing"
  | "Completed"
  | "Closed"
  | "Paid"
  | "Needs review";

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

