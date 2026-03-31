import { EmployeeForm } from "@/components/employees/employee-form";
import { PageHeader } from "@/components/shared/page-header";

export default function NewEmployeePage() {
  return (
    <>
      <PageHeader
        title="Add Employee"
        description="Create a new employee profile with payroll, statutory, and access details before activation."
      />

      <EmployeeForm />
    </>
  );
}

