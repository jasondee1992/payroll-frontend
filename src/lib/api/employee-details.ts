import { getApiErrorMessage, isApiClientError } from "@/lib/api/client";
import {
  buildEmployeeFullName,
  getEmployeeGovernmentInfo,
  getEmployeeRecordsResource,
  getEmployeeSalaryProfile,
  mapEmployeeGovernmentInfo,
  mapEmployeeSalaryProfile,
  normalizeEmployeeStatus,
  normalizeEmploymentType,
  normalizePayrollSchedule,
} from "@/lib/api/employees";
import {
  getEmployeeEffectivePayrollRules,
  getPayrollPeriodRecordsResource,
  getPayrollPolicyProfilesResource,
  getPayrollRunRecordsResource,
  normalizePayrollStatus,
} from "@/lib/api/payroll";
import { getUserRecordsResource } from "@/lib/api/users";
import { formatCurrency, formatDate } from "@/lib/format";
import type { EmployeeStatus } from "@/types/employees";

export type EmployeeProfileData = {
  id: string;
  fullName: string;
  department: string;
  position: string;
  status: EmployeeStatus;
  employmentType: string;
  payrollSchedule: string;
  email: string;
  username: string;
  basicInformation: Array<{ label: string; value: string }>;
  workInformation: Array<{ label: string; value: string }>;
  governmentInformation: Array<{ label: string; value: string }>;
  salaryProfileSummary: Array<{ label: string; value: string }>;
  salaryAllowanceItems: Array<{ label: string; value: string }>;
  salaryAllowanceTotal: string;
  payrollPolicySummary: Array<{ label: string; value: string }>;
  payrollRuleSummary: Array<{ label: string; value: string }>;
  payrollRulesErrorMessage: string | null;
  payrollHistory: Array<{
    period: string;
    runDate: string;
    grossPay: string;
    netPay: string;
    status: string;
  }>;
};

type EmployeeProfileResource = {
  data: EmployeeProfileData | null;
  errorMessage: string | null;
};

function toDisplayText(value?: string | null) {
  return value && value.trim().length > 0 ? value : "Not available";
}

function formatWorkDays(value?: string[] | null) {
  if (!value || value.length === 0) {
    return "Not available";
  }

  return value.join(", ");
}

async function loadOptionalResource<T>(load: () => Promise<T>) {
  try {
    return await load();
  } catch (error) {
    if (isApiClientError(error) && error.status === 404) {
      return null;
    }

    throw error;
  }
}

async function loadPayrollRulesResource(employeeId: string) {
  try {
    return {
      data: await getEmployeeEffectivePayrollRules(employeeId),
      errorMessage: null,
    };
  } catch (error) {
    return {
      data: null,
      errorMessage: getApiErrorMessage(
        error,
        "Effective payroll rules are unavailable from the backend.",
      ),
    };
  }
}

export async function getEmployeeProfileResource(
  employeeCode: string,
): Promise<EmployeeProfileResource> {
  const employeeResult = await getEmployeeRecordsResource();

  if (employeeResult.errorMessage) {
    return {
      data: null,
      errorMessage: employeeResult.errorMessage,
    };
  }

  const employee = employeeResult.data.find(
    (record) => record.employee_code === employeeCode,
  );

  if (!employee) {
    return {
      data: null,
      errorMessage: `Employee ${employeeCode} was not found in the backend response.`,
    };
  }

  const [usersResult, periodsResult, runsResult, governmentInfoRecord, salaryProfileRecord] =
    await Promise.all([
      getUserRecordsResource(),
      getPayrollPeriodRecordsResource(),
      getPayrollRunRecordsResource(),
      loadOptionalResource(() => getEmployeeGovernmentInfo(String(employee.id))),
      loadOptionalResource(() => getEmployeeSalaryProfile(String(employee.id))),
    ]);
  const [policyProfilesResult, payrollRulesResult] = await Promise.all([
    getPayrollPolicyProfilesResource(),
    loadPayrollRulesResource(String(employee.id)),
  ]);

  const linkedUser = usersResult.data.find((user) => user.employee_id === employee.id);
  const payrollPeriodsById = new Map(
    periodsResult.data.map((period) => [period.id, period]),
  );
  const payrollHistory = runsResult.data
    .filter((run) => run.employee_id === employee.id)
    .sort((left, right) => right.created_at.localeCompare(left.created_at))
    .map((run) => {
      const period = payrollPeriodsById.get(run.payroll_period_id);

      return {
        period: period?.period_name ?? `Payroll Period ${run.payroll_period_id}`,
        runDate: formatDate(run.created_at),
        grossPay: formatCurrency(run.gross_pay),
        netPay: formatCurrency(run.net_pay),
        status: normalizePayrollStatus(run.status),
      };
    });

  const governmentInfo = governmentInfoRecord
    ? mapEmployeeGovernmentInfo(governmentInfoRecord)
    : null;
  const salaryProfile = salaryProfileRecord
    ? mapEmployeeSalaryProfile(salaryProfileRecord)
    : null;
  const salaryProfileSummary = salaryProfile
    ? [
        {
          label: "Basic Salary",
          value: formatCurrency(salaryProfile.basicSalary),
        },
        { label: "Rate Type", value: salaryProfile.rateType },
        {
          label: "Effective Date",
          value: salaryProfileRecord
            ? formatDate(salaryProfileRecord.effective_date)
            : "Not available",
        },
      ]
    : [
        {
          label: "Basic Salary",
          value: "Not available",
        },
        { label: "Rate Type", value: "Not available" },
        {
          label: "Effective Date",
          value: "Not available",
        },
      ];
  const salaryAllowanceItems = salaryProfile
    ? salaryProfile.allowanceItems
        .filter((allowance) => Number(allowance.amount) > 0)
        .map((allowance) => ({
          label: allowance.allowanceName,
          value: formatCurrency(allowance.amount),
        }))
    : [];
  const salaryAllowanceTotal = salaryProfile?.totalAllowance
    ? formatCurrency(salaryProfile.totalAllowance)
    : "Not available";
  const assignedPolicyName =
    employee.payroll_policy_name ??
    policyProfilesResult.data.find((profile) => profile.id === employee.payroll_policy_id)
      ?.name ??
    payrollRulesResult.data?.payroll_policy_name ??
    "Not available";
  const payrollPolicySummary = [
    {
      label: "Work Arrangement Type",
      value: toDisplayText(employee.work_arrangement_type),
    },
    {
      label: "Payroll Policy Profile",
      value: assignedPolicyName,
    },
    {
      label: "Payroll Policy Source",
      value: payrollRulesResult.data?.rule_source
        ? formatRuleSource(payrollRulesResult.data.rule_source)
        : "Not available",
    },
  ];
  const payrollRuleSummary = payrollRulesResult.data
    ? [
        {
          label: "Attendance Required",
          value: formatYesNo(payrollRulesResult.data.requires_attendance),
        },
        { label: "Deduct Late", value: formatYesNo(payrollRulesResult.data.deduct_late) },
        {
          label: "Deduct Undertime",
          value: formatYesNo(payrollRulesResult.data.deduct_undertime),
        },
        {
          label: "Deduct Absence",
          value: formatYesNo(payrollRulesResult.data.deduct_absence),
        },
        {
          label: "Allow Overtime",
          value: formatYesNo(payrollRulesResult.data.allow_overtime),
        },
        {
          label: "Require Approved Overtime",
          value: formatYesNo(payrollRulesResult.data.require_approved_overtime),
        },
        {
          label: "Check Leave Records",
          value: formatYesNo(payrollRulesResult.data.check_leave_records),
        },
        {
          label: "Check Sick Leave Records",
          value: formatYesNo(payrollRulesResult.data.check_sick_leave_records),
        },
        {
          label: "Auto Absent If No Log",
          value: formatYesNo(payrollRulesResult.data.auto_absent_if_no_log),
        },
        {
          label: "Use Shift Schedule",
          value: formatYesNo(payrollRulesResult.data.use_shift_schedule),
        },
        {
          label: "Use Daily Hour Requirement",
          value: formatYesNo(payrollRulesResult.data.use_daily_hour_requirement),
        },
      ]
    : [];

  return {
    data: {
      id: employee.employee_code,
      fullName: buildEmployeeFullName(employee),
      department: employee.department,
      position: employee.position,
      status: normalizeEmployeeStatus(
        employee.employment_status,
        employee.is_active,
      ),
      employmentType: normalizeEmploymentType(employee.employment_type),
      payrollSchedule: normalizePayrollSchedule(employee.payroll_schedule),
      email: linkedUser?.email ?? "No linked user account",
      username: linkedUser?.username ?? "No linked user account",
      basicInformation: [
        { label: "First Name", value: employee.first_name },
        { label: "Middle Name", value: toDisplayText(employee.middle_name) },
        { label: "Last Name", value: employee.last_name },
        { label: "Birth Date", value: toDisplayText(employee.birth_date ? formatDate(employee.birth_date) : undefined) },
        { label: "Hire Date", value: toDisplayText(employee.hire_date ? formatDate(employee.hire_date) : undefined) },
        { label: "Suffix", value: toDisplayText(employee.suffix) },
      ],
      workInformation: [
        { label: "Department", value: employee.department },
        { label: "Position", value: employee.position },
        { label: "Employment Type", value: normalizeEmploymentType(employee.employment_type) },
        {
          label: "Employment Status",
          value: normalizeEmployeeStatus(employee.employment_status, employee.is_active),
        },
        { label: "Payroll Schedule", value: normalizePayrollSchedule(employee.payroll_schedule) },
        {
          label: "Work Arrangement Type",
          value: toDisplayText(employee.work_arrangement_type),
        },
        {
          label: "Payroll Policy Profile",
          value: assignedPolicyName,
        },
        { label: "Shift Start", value: toDisplayText(employee.shift_start_time) },
        { label: "Shift End", value: toDisplayText(employee.shift_end_time) },
        { label: "Work Days", value: formatWorkDays(employee.work_days) },
        { label: "Linked User Role", value: linkedUser?.role ?? "Not linked" },
      ],
      governmentInformation: [
        { label: "TIN", value: governmentInfo?.tin ?? "Not available" },
        { label: "SSS Number", value: governmentInfo?.sssNumber ?? "Not available" },
        {
          label: "PhilHealth Number",
          value: governmentInfo?.philHealthNumber ?? "Not available",
        },
        {
          label: "Pag-IBIG Number",
          value: governmentInfo?.pagIbigNumber ?? "Not available",
        },
        { label: "Tax Status", value: governmentInfo?.taxStatus ?? "Not available" },
      ],
      salaryProfileSummary,
      salaryAllowanceItems,
      salaryAllowanceTotal,
      payrollPolicySummary,
      payrollRuleSummary,
      payrollRulesErrorMessage: payrollRulesResult.errorMessage,
      payrollHistory,
    },
    errorMessage: null,
  };
}

function formatYesNo(value: boolean) {
  return value ? "Yes" : "No";
}

function formatRuleSource(value: string) {
  return value
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
