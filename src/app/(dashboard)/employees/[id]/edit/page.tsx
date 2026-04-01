import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EmployeeForm } from "@/components/employees/employee-form";
import { PageHeader } from "@/components/shared/page-header";
import { ResourceErrorState } from "@/components/shared/resource-state";
import { getEditableEmployeeResource } from "@/lib/api/employee-editor";

type EditEmployeePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function EditEmployeePage({
  params,
}: EditEmployeePageProps) {
  const { id } = await params;
  const { data: employee, errorMessage } = await getEditableEmployeeResource(id);

  if (errorMessage || !employee) {
    return (
      <ResourceErrorState
        title="Unable to load employee for editing"
        description={errorMessage ?? "Employee edit data is unavailable."}
        action={
          <Link href={`/employees/${id}`} className="ui-button-secondary">
            Back to Profile
          </Link>
        }
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Employee"
        description="Update employee details, government records, and payroll setup from the current backend record."
        eyebrow="Employees"
        actions={
          <Link href={`/employees/${id}`} className="ui-button-secondary gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </Link>
        }
      />

      <EmployeeForm mode="edit" initialData={employee} />
    </>
  );
}
