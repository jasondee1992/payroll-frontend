import { apiClient } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import {
  createCollectionParser,
  loadApiResource,
} from "@/lib/api/resources";
import {
  parseBoolean,
  parseNumber,
  parseRecord,
  parseString,
} from "@/lib/api/parsers";
import type {
  EmployeeApiRecord,
  EmployeeListResponse,
  EmployeeListItem,
  EmployeeStatus,
} from "@/types/employees";

const EMPLOYEE_STATUS_MAP: Record<string, EmployeeStatus> = {
  active: "Active",
  inactive: "Inactive",
  pending: "Pending",
  onleave: "On Leave",
  "on leave": "On Leave",
};

function normalizeEmployeeStatus(
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

function buildFullName(employee: EmployeeApiRecord) {
  return [
    employee.first_name,
    employee.middle_name ?? undefined,
    employee.last_name,
    employee.suffix ?? undefined,
  ]
    .filter(Boolean)
    .join(" ");
}

function normalizeEmploymentType(value: string): EmployeeListItem["employmentType"] {
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

function normalizePayrollSchedule(
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

export function mapEmployeeListItem(
  employee: EmployeeApiRecord,
): EmployeeListItem {
  return {
    id: employee.employee_code,
    fullName: buildFullName(employee),
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

export async function getEmployees() {
  return apiClient.get<EmployeeListResponse, EmployeeListItem[]>(
    apiEndpoints.employees.list,
    {
      parser: parseEmployeeListResponse,
    },
  );
}

export async function getEmployeesResource() {
  return loadApiResource(() => getEmployees(), {
    fallbackData: [],
    errorMessage: "Unable to load employee data from the backend.",
  });
}
