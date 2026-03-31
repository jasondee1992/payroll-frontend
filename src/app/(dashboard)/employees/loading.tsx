import { PageHeader } from "@/components/shared/page-header";
import { ResourceTableSkeleton } from "@/components/shared/resource-state";

export default function EmployeesLoadingPage() {
  return (
    <>
      <PageHeader
        title="Employees"
        description="Manage employee records, payroll assignments, and workforce status from a central directory."
      />

      <section className="panel p-5 sm:p-6">
        <ResourceTableSkeleton />
      </section>
    </>
  );
}
