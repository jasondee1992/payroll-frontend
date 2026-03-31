export type EmploymentType =
  | "Full-time"
  | "Part-time"
  | "Contract"
  | "Probationary";

export type EmployeeStatus = "Active" | "On Leave" | "Pending" | "Inactive";
export type PayrollSchedule = "Monthly" | "Bi-weekly" | "Weekly";
export type TaxStatus = "Single" | "Married" | "Head of Family";
export type RateType = "Monthly" | "Daily" | "Hourly" | "Bi-weekly";

export interface EmployeeGovernmentInfo {
  tin: string;
  sssNumber: string;
  philHealthNumber: string;
  pagIbigNumber: string;
  taxStatus: TaxStatus;
  withholdingSetup?: string;
}

export interface EmployeeSalaryProfile {
  basicSalary: string;
  rateType: RateType;
  allowance?: string;
  bankAccount?: string;
  currency?: string;
}

export interface Employee {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  fullName: string;
  birthDate: string;
  hireDate: string;
  department: string;
  position: string;
  employmentType: EmploymentType;
  employmentStatus: EmployeeStatus;
  payrollSchedule: PayrollSchedule;
  email?: string;
  username?: string;
  workLocation?: string;
  governmentInfo?: EmployeeGovernmentInfo;
  salaryProfile?: EmployeeSalaryProfile;
}

