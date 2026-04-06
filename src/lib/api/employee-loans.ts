import { apiClient } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import { handleUnauthorizedClientResponse } from "@/lib/auth/client-auth";
import {
  createCollectionParser,
  createResourceParser,
  loadApiResource,
} from "@/lib/api/resources";
import {
  parseBoolean,
  parseCollection,
  parseNumber,
  parseNumericString,
  parseRecord,
  parseString,
} from "@/lib/api/parsers";
import type {
  EmployeeLoanApiRecord,
  EmployeeLoanCreatePayload,
  EmployeeLoanDeductionApiRecord,
  EmployeeLoanDeductionMode,
  EmployeeLoanDeductionSchedule,
  EmployeeLoanStatus,
  EmployeeLoanStatusUpdatePayload,
  EmployeeLoanUpdatePayload,
  LoanTypeApiRecord,
} from "@/types/employee-loans";

export const EMPLOYEE_LOAN_DEDUCTION_SCHEDULE_OPTIONS: Array<{
  value: EmployeeLoanDeductionSchedule;
  label: string;
}> = [
  { value: "first_cutoff", label: "First cutoff" },
  { value: "second_cutoff", label: "Second cutoff" },
  { value: "every_cutoff", label: "Every cutoff" },
];

export const EMPLOYEE_LOAN_DEDUCTION_MODE_OPTIONS: Array<{
  value: EmployeeLoanDeductionMode;
  label: string;
}> = [
  { value: "fixed_amount", label: "Fixed amount" },
  { value: "split_amount", label: "Split amount" },
];

export const EMPLOYEE_LOAN_STATUS_OPTIONS: Array<{
  value: EmployeeLoanStatus;
  label: string;
}> = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "stopped", label: "Stopped" },
  { value: "cancelled", label: "Cancelled" },
];

function parseOptionalString(value: unknown, label: string) {
  return parseString(value, label, { optional: true }) ?? null;
}

function parseOptionalNumericString(value: unknown, label: string) {
  return parseNumericString(value, label, { optional: true }) ?? null;
}

export function parseLoanTypeRecord(value: unknown): LoanTypeApiRecord {
  const record = parseRecord(value, "loan type");

  return {
    id: parseNumber(record.id, "loanType.id"),
    provider: parseString(record.provider, "loanType.provider"),
    code: parseString(record.code, "loanType.code"),
    name: parseString(record.name, "loanType.name"),
    description: parseString(record.description, "loanType.description", {
      optional: true,
    }),
    active: parseBoolean(record.active, "loanType.active"),
    created_at: parseString(record.created_at, "loanType.created_at"),
    updated_at: parseString(record.updated_at, "loanType.updated_at"),
  };
}

export function parseEmployeeLoanDeductionRecord(
  value: unknown,
  index = 0,
): EmployeeLoanDeductionApiRecord {
  const record = parseRecord(value, `employeeLoan.deductions[${index}]`);

  return {
    id: parseNumber(record.id, `employeeLoan.deductions[${index}].id`),
    employee_loan_id: parseNumber(
      record.employee_loan_id,
      `employeeLoan.deductions[${index}].employee_loan_id`,
    ),
    payroll_batch_id: parseNumber(
      record.payroll_batch_id,
      `employeeLoan.deductions[${index}].payroll_batch_id`,
    ),
    attendance_cutoff_id: parseNumber(
      record.attendance_cutoff_id,
      `employeeLoan.deductions[${index}].attendance_cutoff_id`,
    ),
    deduction_date: parseString(
      record.deduction_date,
      `employeeLoan.deductions[${index}].deduction_date`,
    ),
    deducted_amount: parseNumericString(
      record.deducted_amount,
      `employeeLoan.deductions[${index}].deducted_amount`,
    ),
    installment_number: parseNumber(
      record.installment_number,
      `employeeLoan.deductions[${index}].installment_number`,
    ),
    remarks: parseString(record.remarks, `employeeLoan.deductions[${index}].remarks`, {
      optional: true,
    }),
    created_at: parseString(
      record.created_at,
      `employeeLoan.deductions[${index}].created_at`,
    ),
    updated_at: parseString(
      record.updated_at,
      `employeeLoan.deductions[${index}].updated_at`,
    ),
  };
}

export function parseEmployeeLoanRecord(value: unknown): EmployeeLoanApiRecord {
  const record = parseRecord(value, "employee loan");

  return {
    id: parseNumber(record.id, "employeeLoan.id"),
    employee_id: parseNumber(record.employee_id, "employeeLoan.employee_id"),
    employee_code: parseString(record.employee_code, "employeeLoan.employee_code"),
    employee_name: parseString(record.employee_name, "employeeLoan.employee_name"),
    loan_type_id: parseNumber(record.loan_type_id, "employeeLoan.loan_type_id"),
    loan_type_code: parseString(record.loan_type_code, "employeeLoan.loan_type_code"),
    loan_type_name: parseString(record.loan_type_name, "employeeLoan.loan_type_name"),
    provider: parseString(record.provider, "employeeLoan.provider"),
    loan_name: parseString(record.loan_name, "employeeLoan.loan_name"),
    start_date: parseString(record.start_date, "employeeLoan.start_date"),
    monthly_deduction: parseNumericString(
      record.monthly_deduction,
      "employeeLoan.monthly_deduction",
    ),
    term_months: parseNumber(record.term_months, "employeeLoan.term_months"),
    deduction_schedule: parseString(
      record.deduction_schedule,
      "employeeLoan.deduction_schedule",
    ) as EmployeeLoanDeductionSchedule,
    deduction_mode: parseString(
      record.deduction_mode,
      "employeeLoan.deduction_mode",
    ) as EmployeeLoanDeductionMode,
    per_cutoff_amount: parseOptionalNumericString(
      record.per_cutoff_amount,
      "employeeLoan.per_cutoff_amount",
    ),
    total_loan_amount: parseOptionalNumericString(
      record.total_loan_amount,
      "employeeLoan.total_loan_amount",
    ),
    total_deducted_amount: parseNumericString(
      record.total_deducted_amount,
      "employeeLoan.total_deducted_amount",
    ),
    payments_made_count: parseNumber(
      record.payments_made_count,
      "employeeLoan.payments_made_count",
    ),
    remaining_terms: parseNumber(record.remaining_terms, "employeeLoan.remaining_terms"),
    remaining_balance: parseOptionalNumericString(
      record.remaining_balance,
      "employeeLoan.remaining_balance",
    ),
    status: parseString(record.status, "employeeLoan.status") as EmployeeLoanStatus,
    is_auto_stop_when_fully_paid: parseBoolean(
      record.is_auto_stop_when_fully_paid,
      "employeeLoan.is_auto_stop_when_fully_paid",
    ),
    remarks: parseOptionalString(record.remarks, "employeeLoan.remarks"),
    created_by_user_id:
      record.created_by_user_id == null
        ? null
        : parseNumber(record.created_by_user_id, "employeeLoan.created_by_user_id"),
    updated_by_user_id:
      record.updated_by_user_id == null
        ? null
        : parseNumber(record.updated_by_user_id, "employeeLoan.updated_by_user_id"),
    estimated_completion_label: parseOptionalString(
      record.estimated_completion_label,
      "employeeLoan.estimated_completion_label",
    ),
    deductions: parseCollection(
      record.deductions ?? [],
      (item, index) => parseEmployeeLoanDeductionRecord(item, index),
      "employeeLoan.deductions",
    ),
    created_at: parseString(record.created_at, "employeeLoan.created_at"),
    updated_at: parseString(record.updated_at, "employeeLoan.updated_at"),
  };
}

const parseLoanTypesResponse = createCollectionParser({
  label: "loan types",
  parseItem: (item) => parseLoanTypeRecord(item),
});

const parseEmployeeLoansResponse = createCollectionParser({
  label: "employee loans",
  parseItem: (item) => parseEmployeeLoanRecord(item),
});

const parseEmployeeLoanResponse = createResourceParser({
  parse: parseEmployeeLoanRecord,
});

const parseEmployeeLoanDeductionHistoryResponse = createCollectionParser({
  label: "employee loan deductions",
  parseItem: (item, index) => parseEmployeeLoanDeductionRecord(item, index),
});

export function formatEmployeeLoanStatus(status: EmployeeLoanStatus) {
  return (
    EMPLOYEE_LOAN_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    status
  );
}

export function formatEmployeeLoanDeductionSchedule(
  schedule: EmployeeLoanDeductionSchedule,
) {
  return (
    EMPLOYEE_LOAN_DEDUCTION_SCHEDULE_OPTIONS.find(
      (option) => option.value === schedule,
    )?.label ?? schedule
  );
}

export function formatEmployeeLoanDeductionMode(
  mode: EmployeeLoanDeductionMode,
) {
  return (
    EMPLOYEE_LOAN_DEDUCTION_MODE_OPTIONS.find((option) => option.value === mode)
      ?.label ?? mode
  );
}

export async function getLoanTypes() {
  return apiClient.get<LoanTypeApiRecord[], LoanTypeApiRecord[]>(
    apiEndpoints.employeeLoans.loanTypes,
    {
      parser: parseLoanTypesResponse,
    },
  );
}

export async function getEmployeeLoans(employeeId: string) {
  return apiClient.get<EmployeeLoanApiRecord[], EmployeeLoanApiRecord[]>(
    apiEndpoints.employeeLoans.list(employeeId),
    {
      parser: parseEmployeeLoansResponse,
    },
  );
}

export async function getEmployeeLoanDeductionHistory(
  employeeId: string,
  loanId: string,
) {
  return apiClient.get<
    EmployeeLoanDeductionApiRecord[],
    EmployeeLoanDeductionApiRecord[]
  >(apiEndpoints.employeeLoans.deductions(employeeId, loanId), {
    parser: parseEmployeeLoanDeductionHistoryResponse,
  });
}

export async function getLoanTypesResource() {
  return loadApiResource(() => getLoanTypes(), {
    fallbackData: [],
    errorMessage: "Unable to load employee loan types from the backend.",
  });
}

export async function getEmployeeLoansResource(employeeId: string) {
  return loadApiResource(() => getEmployeeLoans(employeeId), {
    fallbackData: [],
    errorMessage: "Unable to load employee government loans from the backend.",
  });
}

function getLoanMutationErrorMessage(responseBody: unknown) {
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
  }

  if (typeof responseBody === "string" && responseBody.trim().length > 0) {
    return responseBody;
  }

  return "Unable to save the employee loan record.";
}

async function requestEmployeeLoanMutation<TPayload>(
  path: string,
  method: "POST" | "PUT",
  payload: TPayload,
) {
  const response = await fetch(path, {
    method,
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
    throw new Error(getLoanMutationErrorMessage(responseBody));
  }

  return parseEmployeeLoanResponse(responseBody);
}

export async function createEmployeeLoan(
  employeeId: number,
  payload: EmployeeLoanCreatePayload,
) {
  return requestEmployeeLoanMutation(`/api/employees/${employeeId}/loans`, "POST", payload);
}

export async function updateEmployeeLoan(
  employeeId: number,
  loanId: number,
  payload: EmployeeLoanUpdatePayload,
) {
  return requestEmployeeLoanMutation(
    `/api/employees/${employeeId}/loans/${loanId}`,
    "PUT",
    payload,
  );
}

export async function updateEmployeeLoanStatus(
  employeeId: number,
  loanId: number,
  payload: EmployeeLoanStatusUpdatePayload,
) {
  return requestEmployeeLoanMutation(
    `/api/employees/${employeeId}/loans/${loanId}/status`,
    "POST",
    payload,
  );
}
