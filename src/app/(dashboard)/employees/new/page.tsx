import { EmployeeForm } from "@/components/employees/employee-form";
import { PageHeader } from "@/components/shared/page-header";
import { getActiveEmployeeManagerOptionsResource } from "@/lib/api/employees";

export const dynamic = "force-dynamic";

export default async function NewEmployeePage() {
  const { data: activeEmployeeOptions, errorMessage } =
    await getActiveEmployeeManagerOptionsResource();

  return (
    <>
      <PageHeader
        title="Add Employee"
        description="Create a new employee profile with payroll, statutory, and access details before activation."
      />

      <EmployeeForm
        activeEmployeeOptions={activeEmployeeOptions}
        managerOptionsErrorMessage={errorMessage}
      />
    </>
  );
}

