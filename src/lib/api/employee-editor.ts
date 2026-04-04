import { isApiClientError } from "@/lib/api/client";
import {
  getEmployeeGovernmentInfo,
  getEmployeeRecordsResource,
  getEmployeeSalaryProfile,
  mapEmployeeGovernmentInfo,
  mapEmployeeSalaryProfile,
  normalizeEmployeeStatus,
  normalizeEmploymentType,
  normalizePayrollSchedule,
} from "@/lib/api/employees";
import { getUserRecordsResource } from "@/lib/api/users";

export type EditableEmployeeData = {
  employeeId: number;
  employeeCode: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  birthDate: string;
  hireDate: string;
  endDate: string;
  department: string;
  position: string;
  reportingManagerId: string;
  reportingManagerName: string;
  employmentType: string;
  employmentStatus: string;
  payrollSchedule: string;
  contactNumber: string;
  tin: string;
  sssNumber: string;
  philHealthNumber: string;
  pagIbigNumber: string;
  taxStatus: string;
  basicSalary: string;
  rateType: string;
  allowances: Array<{
    allowanceName: string;
    amount: string;
  }>;
  accountAccess: {
    userId: number | null;
    linked: boolean;
    email: string;
    username: string;
    role: string;
  };
};

type EditableEmployeeResource = {
  data: EditableEmployeeData | null;
  errorMessage: string | null;
};

function toEditableDate(value?: string | null) {
  return value ?? "";
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

export async function getEditableEmployeeResource(
  employeeCode: string,
): Promise<EditableEmployeeResource> {
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

  const [usersResult, governmentInfoRecord, salaryProfileRecord] = await Promise.all([
    getUserRecordsResource(),
    loadOptionalResource(() => getEmployeeGovernmentInfo(String(employee.id))),
    loadOptionalResource(() => getEmployeeSalaryProfile(String(employee.id))),
  ]);

  const linkedUser = usersResult.data.find((user) => user.employee_id === employee.id);
  const governmentInfo = governmentInfoRecord
    ? mapEmployeeGovernmentInfo(governmentInfoRecord)
    : null;
  const salaryProfile = salaryProfileRecord
    ? mapEmployeeSalaryProfile(salaryProfileRecord)
    : null;

  return {
    data: {
      employeeId: employee.id,
      employeeCode: employee.employee_code,
      firstName: employee.first_name,
      middleName: employee.middle_name ?? "",
      lastName: employee.last_name,
      suffix: employee.suffix ?? "None",
      birthDate: toEditableDate(employee.birth_date),
      hireDate: toEditableDate(employee.hire_date),
      endDate: toEditableDate(employee.end_date),
      department: employee.department,
      position: employee.position,
      reportingManagerId: employee.reporting_manager_id
        ? String(employee.reporting_manager_id)
        : "",
      reportingManagerName: employee.reporting_manager_name ?? "",
      employmentType: normalizeEmploymentType(employee.employment_type),
      employmentStatus: normalizeEmployeeStatus(
        employee.employment_status,
        employee.is_active,
      ),
      payrollSchedule: normalizePayrollSchedule(employee.payroll_schedule),
      contactNumber: employee.contact_number ?? "",
      tin: governmentInfo?.tin ?? "",
      sssNumber: governmentInfo?.sssNumber ?? "",
      philHealthNumber: governmentInfo?.philHealthNumber ?? "",
      pagIbigNumber: governmentInfo?.pagIbigNumber ?? "",
      taxStatus: governmentInfo?.taxStatus ?? "Select tax status",
      basicSalary: salaryProfile?.basicSalary ?? "",
      rateType: salaryProfile?.rateType ?? "Select rate type",
      allowances:
        salaryProfile?.allowanceItems
          .filter((allowance) => Number(allowance.amount) > 0)
          .map((allowance) => ({
            allowanceName: allowance.allowanceName,
            amount: allowance.amount,
          })) ?? [],
      accountAccess: {
        userId: linkedUser?.id ?? null,
        linked: Boolean(linkedUser),
        email: linkedUser?.email ?? "",
        username: linkedUser?.username ?? "",
        role: linkedUser?.role ?? "",
      },
    },
    errorMessage: null,
  };
}
