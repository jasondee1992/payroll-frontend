import Link from "next/link";
import { EmployeeListToolbar } from "@/components/employees/employee-list-toolbar";
import { EmployeePagination } from "@/components/employees/employee-pagination";
import { EmployeeTable } from "@/components/employees/employee-table";
import { PageHeader } from "@/components/shared/page-header";
import { ResourceErrorState } from "@/components/shared/resource-state";
import { getEmployeesResource } from "@/lib/api/employees";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const { data: employees, errorMessage } = await getEmployeesResource();

  return (
    <>
      <PageHeader
        title="Employees"
        description="Manage employee records, payroll assignments, and workforce status from a central directory."
        actions={
          <Link
            href="/employees/new"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/15"
          >
            Add Employee
          </Link>
        }
      />

      <section className="panel p-5 sm:p-6">
        <EmployeeListToolbar />

        <div className="mt-6">
          {errorMessage ? (
            <ResourceErrorState
              title="Unable to load employees"
              description={`${errorMessage} Make sure the FastAPI backend is running at the configured API URL and the \`/api/v1/employees\` endpoint is available.`}
            />
          ) : (
            <EmployeeTable employees={employees} />
          )}
        </div>

        {!errorMessage && employees.length > 0 ? (
          <div className="mt-6">
            <EmployeePagination
              currentPage={1}
              totalPages={1}
              pageSize={employees.length}
              totalItems={employees.length}
            />
          </div>
        ) : null}
      </section>
    </>
  );
}
