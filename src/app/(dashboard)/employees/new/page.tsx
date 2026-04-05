import { EmployeeForm } from "@/components/employees/employee-form";
import { PageHeader } from "@/components/shared/page-header";
import { getActiveEmployeeManagerOptionsResource } from "@/lib/api/employees";
import { getPayrollPolicyProfilesResource } from "@/lib/api/payroll";

export const dynamic = "force-dynamic";

export default async function NewEmployeePage() {
  const [
    { data: activeEmployeeOptions, errorMessage },
    { data: payrollPolicyProfiles, errorMessage: payrollPolicyProfilesErrorMessage },
  ] = await Promise.all([
    getActiveEmployeeManagerOptionsResource(),
    getPayrollPolicyProfilesResource(),
  ]);

  return (
    <>
      <PageHeader
        title="Add Employee"
        description="Create a new employee profile with payroll, statutory, and access details before activation."
      />

      <EmployeeForm
        activeEmployeeOptions={activeEmployeeOptions}
        managerOptionsErrorMessage={errorMessage}
        payrollPolicyProfiles={payrollPolicyProfiles}
        payrollPolicyProfilesErrorMessage={payrollPolicyProfilesErrorMessage}
      />
    </>
  );
}

