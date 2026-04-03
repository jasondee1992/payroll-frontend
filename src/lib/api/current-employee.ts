import { getEmployeeRecordsResource } from "@/lib/api/employees";
import { getUserRecordsResource } from "@/lib/api/users";

export type CurrentEmployeeRequestContext = {
  employeeId: number | null;
  employeeCode: string | null;
  employeeName: string | null;
  reportingManagerName: string | null;
};

export async function getCurrentEmployeeRequestContextResource(
  username: string | null,
) {
  if (!username) {
    return {
      data: {
        employeeId: null,
        employeeCode: null,
        employeeName: null,
        reportingManagerName: null,
      } satisfies CurrentEmployeeRequestContext,
      errorMessage: null,
    };
  }

  const [usersResult, employeesResult] = await Promise.all([
    getUserRecordsResource(),
    getEmployeeRecordsResource(),
  ]);

  if (usersResult.errorMessage) {
    return {
      data: {
        employeeId: null,
        employeeCode: null,
        employeeName: null,
        reportingManagerName: null,
      } satisfies CurrentEmployeeRequestContext,
      errorMessage: usersResult.errorMessage,
    };
  }

  if (employeesResult.errorMessage) {
    return {
      data: {
        employeeId: null,
        employeeCode: null,
        employeeName: null,
        reportingManagerName: null,
      } satisfies CurrentEmployeeRequestContext,
      errorMessage: employeesResult.errorMessage,
    };
  }

  const linkedUser = usersResult.data.find((user) => user.username === username);

  if (!linkedUser?.employee_id) {
    return {
      data: {
        employeeId: null,
        employeeCode: null,
        employeeName: null,
        reportingManagerName: null,
      } satisfies CurrentEmployeeRequestContext,
      errorMessage: null,
    };
  }

  const employee = employeesResult.data.find(
    (record) => record.id === linkedUser.employee_id,
  );

  if (!employee) {
    return {
      data: {
        employeeId: null,
        employeeCode: null,
        employeeName: null,
        reportingManagerName: null,
      } satisfies CurrentEmployeeRequestContext,
      errorMessage: null,
    };
  }

  return {
    data: {
      employeeId: employee.id,
      employeeCode: employee.employee_code,
      employeeName: [employee.first_name, employee.last_name]
        .filter(Boolean)
        .join(" "),
      reportingManagerName: employee.reporting_manager_name ?? null,
    } satisfies CurrentEmployeeRequestContext,
    errorMessage: null,
  };
}
