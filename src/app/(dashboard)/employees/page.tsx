import Link from "next/link";
import { EmployeeListToolbar } from "@/components/employees/employee-list-toolbar";
import { EmployeePagination } from "@/components/employees/employee-pagination";
import { EmployeeTable } from "@/components/employees/employee-table";
import { PageHeader } from "@/components/shared/page-header";
import { ResourceErrorState } from "@/components/shared/resource-state";
import { getEmployeesResource } from "@/lib/api/employees";
import { getServerAuthSession } from "@/lib/auth/server-session";
import { canManageEmployees } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const [{ data: employees, errorMessage }, authSession] = await Promise.all([
    getEmployeesResource(),
    getServerAuthSession(),
  ]);
  const canAddEmployee = canManageEmployees(authSession.role);

  return (
    <>
      <PageHeader
        title="Employees"
        description="Manage employee records, payroll assignments, and workforce status from a central directory."
        actions={canAddEmployee ? (
          <Link
            href="/employees/new"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/15"
          >
            Add Employee
          </Link>
        ) : null}
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
            <EmployeeTable employees={employees} canManageEmployees={canAddEmployee} />
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
