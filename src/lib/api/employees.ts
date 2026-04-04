import { apiClient } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import { handleUnauthorizedClientResponse } from "@/lib/auth/client-auth";
import {
  createCollectionParser,
  createResourceParser,
  loadApiResource,
} from "@/lib/api/resources";
import {
  parseCollection,
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
  EmployeeManagerOption,
  EmployeeSalaryProfileAllowanceApiRecord,
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
    end_date: parseString(record.end_date, "employee.end_date", {
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
    contact_number: parseString(record.contact_number, "employee.contact_number", {
      optional: true,
    }),
    department: parseString(record.department, "employee.department"),
    position: parseString(record.position, "employee.position"),
    payroll_schedule: parseString(
      record.payroll_schedule,
      "employee.payroll_schedule",
    ),
    reporting_manager_id:
      record.reporting_manager_id == null
        ? null
        : parseNumber(record.reporting_manager_id, "employee.reporting_manager_id"),
    reporting_manager_name: parseString(
      record.reporting_manager_name,
      "employee.reporting_manager_name",
      { optional: true },
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
    total_allowance: parseNumericString(
      record.total_allowance,
      "salaryProfile.total_allowance",
    ),
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
    hourly_rate: parseNumericString(
      record.hourly_rate,
      "salaryProfile.hourly_rate",
      { optional: true },
    ),
    effective_date: parseString(
      record.effective_date,
      "salaryProfile.effective_date",
    ),
    is_active: parseBoolean(record.is_active, "salaryProfile.is_active"),
    allowances: parseCollection(
      record.allowances ?? [],
      (allowance, index) =>
        parseEmployeeSalaryProfileAllowanceRecord(allowance, index),
      "salaryProfile.allowances",
    ),
    created_at: parseString(record.created_at, "salaryProfile.created_at"),
    updated_at: parseString(record.updated_at, "salaryProfile.updated_at"),
  };
}

export function parseEmployeeSalaryProfileAllowanceRecord(
  value: unknown,
  index = 0,
): EmployeeSalaryProfileAllowanceApiRecord {
  const record = parseRecord(value, `salaryProfile.allowances[${index}]`);

  return {
    id: parseNumber(record.id, `salaryProfile.allowances[${index}].id`),
    allowance_name: parseString(
      record.allowance_name,
      `salaryProfile.allowances[${index}].allowance_name`,
    ),
    amount: parseNumericString(
      record.amount,
      `salaryProfile.allowances[${index}].amount`,
    ),
    is_active: parseBoolean(
      record.is_active,
      `salaryProfile.allowances[${index}].is_active`,
    ),
    created_at: parseString(
      record.created_at,
      `salaryProfile.allowances[${index}].created_at`,
    ),
    updated_at: parseString(
      record.updated_at,
      `salaryProfile.allowances[${index}].updated_at`,
    ),
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

export function mapEmployeeManagerOption(
  employee: EmployeeApiRecord,
): EmployeeManagerOption {
  return {
    value: String(employee.id),
    label: formatEmployeeManagerLabel(employee),
    description: employee.employee_code,
  };
}

function formatEmployeeManagerLabel(employee: EmployeeApiRecord) {
  const firstNameParts = [
    employee.first_name,
    employee.middle_name ?? undefined,
    employee.suffix ?? undefined,
  ]
    .filter(Boolean)
    .join(" ");

  return [employee.last_name, firstNameParts].filter(Boolean).join(", ");
}

export function mapEmployeeSalaryProfile(record: EmployeeSalaryProfileApiRecord) {
  return {
    basicSalary: record.basic_salary,
    rateType: normalizeRateType(record.rate_type),
    allowance: record.allowance,
    totalAllowance: record.total_allowance,
    allowanceItems: record.allowances
      .filter((allowance) => allowance.is_active)
      .map((allowance) => ({
        id: allowance.id,
        allowanceName: allowance.allowance_name,
        amount: allowance.amount,
        isActive: allowance.is_active,
      })),
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

export async function getActiveEmployeeManagerOptionsResource(
  excludedEmployeeId?: number,
) {
  const employeeResult = await getEmployeeRecordsResource();

  return {
    data: employeeResult.data
      .filter((employee) => {
        if (excludedEmployeeId != null && employee.id === excludedEmployeeId) {
          return false;
        }

        return (
          normalizeEmployeeStatus(employee.employment_status, employee.is_active) ===
          "Active"
        );
      })
      .map((employee) => mapEmployeeManagerOption(employee)),
    errorMessage: employeeResult.errorMessage,
  };
}

export type EmployeeOnboardingPayload = {
  employee: {
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
    is_active: boolean;
  };
  government_info: {
    tin: string;
    sss_number: string;
    philhealth_number: string;
    pagibig_number: string;
    tax_status: string;
  };
  salary_profile: {
    basic_salary: number;
    rate_type: string;
    pay_frequency?: string;
    effective_date?: string | null;
    allowances: Array<{
      allowance_name: string;
      amount: number;
    }>;
  };
  account_access: {
    enabled: boolean;
    email?: string;
    username?: string;
    role?: string;
  };
};

export type EmployeeOnboardingResult = {
  employeeCode: string;
  employeeFullName: string;
  linkedUsername?: string;
  salarySubtotal: string;
  totalAllowance: string;
  temporaryPassword?: string;
};

export type EmployeeUpdatePayload = {
  employee: {
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
    is_active: boolean;
  };
  government_info: {
    tin: string;
    sss_number: string;
    philhealth_number: string;
    pagibig_number: string;
    tax_status: string;
  };
  salary_profile: {
    basic_salary: number;
    rate_type: string;
    pay_frequency: string;
    allowances: Array<{
      allowance_name: string;
      amount: number;
    }>;
  };
};

function parseEmployeeOnboardingResponse(
  value: unknown,
): EmployeeOnboardingResult {
  const record = parseRecord(value, "employee onboarding response");
  const employee = parseEmployeeRecord(record.employee);
  const linkedUser =
    record.linked_user == null
      ? undefined
      : parseRecord(record.linked_user, "linked user");
  const temporaryPassword = parseString(
    record.temporary_password,
    "employee onboarding temporary_password",
    { optional: true },
  );

  return {
    employeeCode: employee.employee_code,
    employeeFullName: buildEmployeeFullName(employee),
    linkedUsername: linkedUser
      ? parseString(linkedUser.username, "linked user.username")
      : undefined,
    salarySubtotal: parseNumericString(
      record.salary_subtotal,
      "employee onboarding salary_subtotal",
    ),
    totalAllowance: parseNumericString(
      record.total_allowance,
      "employee onboarding total_allowance",
    ),
    temporaryPassword,
  };
}

function getEmployeeOnboardingErrorMessage(responseBody: unknown) {
  if (
    responseBody &&
    typeof responseBody === "object" &&
    !Array.isArray(responseBody)
  ) {
    if (
      "error" in responseBody &&
      typeof responseBody.error === "string" &&
      responseBody.error.trim().length > 0
    ) {
      return responseBody.error;
    }

    if (
      "detail" in responseBody &&
      typeof responseBody.detail === "string" &&
      responseBody.detail.trim().length > 0
    ) {
      return responseBody.detail;
    }

    if ("detail" in responseBody && Array.isArray(responseBody.detail)) {
      const detailMessages = responseBody.detail
        .map((detail) => {
          if (
            detail &&
            typeof detail === "object" &&
            "msg" in detail &&
            typeof detail.msg === "string"
          ) {
            return detail.msg;
          }

          return null;
        })
        .filter((detail): detail is string => detail !== null);

      if (detailMessages.length > 0) {
        return detailMessages.join(" ");
      }
    }
  }

  if (typeof responseBody === "string" && responseBody.trim().length > 0) {
    return responseBody;
  }

  return "Unable to save the employee record.";
}

export async function onboardEmployee(
  payload: EmployeeOnboardingPayload,
) {
  const response = await fetch("/api/employees/onboard", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const responseBody = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (await handleUnauthorizedClientResponse(response)) {
    throw new Error("Your session has expired. Redirecting to login.");
  }

  if (!response.ok) {
    throw new Error(getEmployeeOnboardingErrorMessage(responseBody));
  }

  return parseEmployeeOnboardingResponse(responseBody);
}

export async function updateEmployeeProfile(
  employeeId: number,
  payload: EmployeeUpdatePayload,
) {
  const response = await fetch(`/api/employees/${employeeId}`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const responseBody = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (await handleUnauthorizedClientResponse(response)) {
    throw new Error("Your session has expired. Redirecting to login.");
  }

  if (!response.ok) {
    throw new Error(getEmployeeOnboardingErrorMessage(responseBody));
  }

  if (
    responseBody &&
    typeof responseBody === "object" &&
    !Array.isArray(responseBody) &&
    "employee" in responseBody
  ) {
    const employee = parseEmployeeRecord(responseBody.employee);
    return {
      employeeCode: employee.employee_code,
    };
  }

  return {
    employeeCode: payload.employee.employee_code,
  };
}
