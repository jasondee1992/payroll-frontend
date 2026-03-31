import type { PayrollSchedule } from "@/types/employees";

export type PayrollStatus =
  | "Draft"
  | "Open"
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

