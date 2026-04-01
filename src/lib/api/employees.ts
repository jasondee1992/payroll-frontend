import { apiClient } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import {
  createCollectionParser,
  createResourceParser,
  loadApiResource,
} from "@/lib/api/resources";
import {
  parseBoolean,
  parseNumericString,
  parseNumber,
  parseRecord,
  parseString,
} from "@/lib/api/parsers";
import type {
  EmployeeApiRecord,
  EmployeeGovernmentInfoApiRecord,
  EmployeeListResponse,
  EmployeeListItem,
  EmployeeSalaryProfileApiRecord,
  EmployeeStatus,
} from "@/types/employees";

const EMPLOYEE_STATUS_MAP: Record<string, EmployeeStatus> = {
  active: "Active",
  inactive: "Inactive",
  pending: "Pending",
  onleave: "On Leave",
  "on leave": "On Leave",
};

export function normalizeEmployeeStatus(
  employmentStatus: string,
  isActive: boolean,
): EmployeeStatus {
  const normalizedKey = employmentStatus.trim().toLowerCase();
  const normalizedStatus = EMPLOYEE_STATUS_MAP[normalizedKey];

  if (normalizedStatus) {
    return normalizedStatus;
  }

  return isActive ? "Active" : "Inactive";
}

export function buildEmployeeFullName(employee: EmployeeApiRecord) {
  return [
    employee.first_name,
    employee.middle_name ?? undefined,
    employee.last_name,
    employee.suffix ?? undefined,
  ]
    .filter(Boolean)
    .join(" ");
}

export function normalizeRateType(
  value: string,
): "Monthly" | "Daily" | "Hourly" | "Bi-weekly" {
  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue === "daily") {
    return "Daily";
  }

  if (normalizedValue === "hourly") {
    return "Hourly";
  }

  if (
    normalizedValue === "bi-weekly" ||
    normalizedValue === "bi weekly" ||
    normalizedValue === "semi-monthly" ||
    normalizedValue === "semi monthly"
  ) {
    return "Bi-weekly";
  }

  return "Monthly";
}

export function parseEmployeeRecord(value: unknown): EmployeeApiRecord {
  const record = parseRecord(value, "employee");

  return {
    id: parseNumber(record.id, "employee.id"),
    employee_code: parseString(record.employee_code, "employee.employee_code"),
    first_name: parseString(record.first_name, "employee.first_name"),
    middle_name: parseString(record.middle_name, "employee.middle_name", {
      optional: true,
    }),
    last_name: parseString(record.last_name, "employee.last_name"),
    suffix: parseString(record.suffix, "employee.suffix", { optional: true }),
    birth_date: parseString(record.birth_date, "employee.birth_date", {
      optional: true,
    }),
    hire_date: parseString(record.hire_date, "employee.hire_date", {
      optional: true,
    }),
    employment_status: parseString(
      record.employment_status,
      "employee.employment_status",
    ),
    employment_type: parseString(
      record.employment_type,
      "employee.employment_type",
    ),
    department: parseString(record.department, "employee.department"),
    position: parseString(record.position, "employee.position"),
    payroll_schedule: parseString(
      record.payroll_schedule,
      "employee.payroll_schedule",
    ),
    is_active: parseBoolean(record.is_active, "employee.is_active"),
    created_at: parseString(record.created_at, "employee.created_at"),
    updated_at: parseString(record.updated_at, "employee.updated_at"),
  };
}

export function parseEmployeeGovernmentInfoRecord(
  value: unknown,
): EmployeeGovernmentInfoApiRecord {
  const record = parseRecord(value, "employee government information");

  return {
    id: parseNumber(record.id, "governmentInfo.id"),
    employee_id: parseNumber(record.employee_id, "governmentInfo.employee_id"),
    tin: parseString(record.tin, "governmentInfo.tin"),
    sss_number: parseString(record.sss_number, "governmentInfo.sss_number"),
    philhealth_number: parseString(
      record.philhealth_number,
      "governmentInfo.philhealth_number",
    ),
    pagibig_number: parseString(
      record.pagibig_number,
      "governmentInfo.pagibig_number",
    ),
    tax_status: parseString(record.tax_status, "governmentInfo.tax_status"),
    created_at: parseString(record.created_at, "governmentInfo.created_at"),
    updated_at: parseString(record.updated_at, "governmentInfo.updated_at"),
  };
}

export function parseEmployeeSalaryProfileRecord(
  value: unknown,
): EmployeeSalaryProfileApiRecord {
  const record = parseRecord(value, "employee salary profile");

  return {
    id: parseNumber(record.id, "salaryProfile.id"),
    employee_id: parseNumber(record.employee_id, "salaryProfile.employee_id"),
    basic_salary: parseNumericString(
      record.basic_salary,
      "salaryProfile.basic_salary",
    ),
    allowance: parseNumericString(record.allowance, "salaryProfile.allowance"),
    pay_frequency: parseString(
      record.pay_frequency,
      "salaryProfile.pay_frequency",
    ),
    rate_type: parseString(record.rate_type, "salaryProfile.rate_type"),
    daily_rate: parseNumericString(record.daily_rate, "salaryProfile.daily_rate", {
      optional: true,
    }),
    monthly_rate: parseNumericString(
      record.monthly_rate,
      "salaryProfile.monthly_rate",
      { optional: true },
    ),
    effective_date: parseString(
      record.effective_date,
      "salaryProfile.effective_date",
    ),
    is_active: parseBoolean(record.is_active, "salaryProfile.is_active"),
    created_at: parseString(record.created_at, "salaryProfile.created_at"),
    updated_at: parseString(record.updated_at, "salaryProfile.updated_at"),
  };
}

export function normalizeEmploymentType(
  value: string,
): EmployeeListItem["employmentType"] {
  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue === "full-time" || normalizedValue === "full time") {
    return "Full-time";
  }

  if (normalizedValue === "part-time" || normalizedValue === "part time") {
    return "Part-time";
  }

  if (normalizedValue === "probationary") {
    return "Probationary";
  }

  return "Contract";
}

export function normalizePayrollSchedule(
  value: string,
): EmployeeListItem["payrollSchedule"] {
  const normalizedValue = value.trim().toLowerCase();

  if (
    normalizedValue === "bi-weekly" ||
    normalizedValue === "bi weekly" ||
    normalizedValue === "semi-monthly" ||
    normalizedValue === "semi monthly"
  ) {
    return "Bi-weekly";
  }

  if (normalizedValue === "weekly") {
    return "Weekly";
  }

  return "Monthly";
}

export function mapEmployeeListItem(
  employee: EmployeeApiRecord,
): EmployeeListItem {
  return {
    id: employee.employee_code,
    fullName: buildEmployeeFullName(employee),
    department: employee.department,
    position: employee.position,
    employmentType: normalizeEmploymentType(employee.employment_type),
    payrollSchedule: normalizePayrollSchedule(employee.payroll_schedule),
    status: normalizeEmployeeStatus(
      employee.employment_status,
      employee.is_active,
    ),
  };
}

const parseEmployeeListResponse = createCollectionParser({
  label: "employees",
  parseItem: (employee: unknown) => parseEmployeeRecord(employee),
  mapItem: (employee: EmployeeApiRecord) => mapEmployeeListItem(employee),
});

const parseEmployeeRecordCollection = createCollectionParser({
  label: "employees",
  parseItem: (employee: unknown) => parseEmployeeRecord(employee),
});

const parseEmployeeGovernmentInfoResponse = createResourceParser({
  parse: parseEmployeeGovernmentInfoRecord,
});

const parseEmployeeSalaryProfileResponse = createResourceParser({
  parse: parseEmployeeSalaryProfileRecord,
});

export function mapEmployeeGovernmentInfo(record: EmployeeGovernmentInfoApiRecord) {
  return {
    tin: record.tin,
    sssNumber: record.sss_number,
    philHealthNumber: record.philhealth_number,
    pagIbigNumber: record.pagibig_number,
    taxStatus: record.tax_status,
  };
}

export function mapEmployeeSalaryProfile(record: EmployeeSalaryProfileApiRecord) {
  return {
    basicSalary: record.basic_salary,
    rateType: normalizeRateType(record.rate_type),
    allowance: record.allowance,
    currency: "PHP",
  };
}

export async function getEmployees() {
  return apiClient.get<EmployeeListResponse, EmployeeListItem[]>(
    apiEndpoints.employees.list,
    {
      parser: parseEmployeeListResponse,
    },
  );
}

export async function getEmployeeRecords() {
  return apiClient.get<EmployeeListResponse, EmployeeApiRecord[]>(
    apiEndpoints.employees.list,
    {
      parser: parseEmployeeRecordCollection,
    },
  );
}

export async function getEmployeeGovernmentInfo(employeeId: string) {
  return apiClient.get<
    EmployeeGovernmentInfoApiRecord,
    EmployeeGovernmentInfoApiRecord
  >(apiEndpoints.employees.governmentInfo(employeeId), {
    parser: parseEmployeeGovernmentInfoResponse,
  });
}

export async function getEmployeeSalaryProfile(employeeId: string) {
  return apiClient.get<EmployeeSalaryProfileApiRecord, EmployeeSalaryProfileApiRecord>(
    apiEndpoints.employees.salaryProfile(employeeId),
    {
      parser: parseEmployeeSalaryProfileResponse,
    },
  );
}

export async function getEmployeesResource() {
  return loadApiResource(() => getEmployees(), {
    fallbackData: [],
    errorMessage: "Unable to load employee data from the backend.",
  });
}

export async function getEmployeeRecordsResource() {
  return loadApiResource(() => getEmployeeRecords(), {
    fallbackData: [],
    errorMessage: "Unable to load employee data from the backend.",
  });
}
