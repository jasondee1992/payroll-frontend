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
  totalAllowance?: string;
  allowanceItems?: EmployeeSalaryProfileAllowance[];
  bankAccount?: string;
  currency?: string;
}

export interface EmployeeSalaryProfileAllowance {
  id: number;
  allowanceName: string;
  amount: string;
  isActive: boolean;
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

export interface EmployeeApiRecord {
  id: number;
  employee_code: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  suffix?: string | null;
  birth_date?: string | null;
  hire_date?: string | null;
  end_date?: string | null;
  employment_status: string;
  employment_type: string;
  contact_number?: string | null;
  department: string;
  position: string;
  payroll_schedule: string;
  reporting_manager_id?: number | null;
  reporting_manager_name?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeGovernmentInfoApiRecord {
  id: number;
  employee_id: number;
  tin: string;
  sss_number: string;
  philhealth_number: string;
  pagibig_number: string;
  tax_status: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeSalaryProfileApiRecord {
  id: number;
  employee_id: number;
  basic_salary: string;
  allowance: string;
  total_allowance: string;
  pay_frequency: string;
  rate_type: string;
  daily_rate?: string;
  monthly_rate?: string;
  hourly_rate?: string;
  effective_date: string;
  is_active: boolean;
  allowances: EmployeeSalaryProfileAllowanceApiRecord[];
  created_at: string;
  updated_at: string;
}

export interface EmployeeSalaryProfileAllowanceApiRecord {
  id: number;
  allowance_name: string;
  amount: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type EmployeeListResponse = EmployeeApiRecord[];

export type EmployeeListItem = Pick<
  Employee,
  "id" | "fullName" | "department" | "position" | "employmentType" | "payrollSchedule"
> & {
  status: EmployeeStatus;
};

export type EmployeeManagerOption = {
  value: string;
  label: string;
  description: string;
};
