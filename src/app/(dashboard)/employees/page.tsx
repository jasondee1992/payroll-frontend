import Link from "next/link";
import { EmployeeImportExportControls } from "@/components/employees/employee-import-export-controls";
import { EmployeeListToolbar } from "@/components/employees/employee-list-toolbar";
import { EmployeePagination } from "@/components/employees/employee-pagination";
import { EmployeeTable } from "@/components/employees/employee-table";
import { PageHeader } from "@/components/shared/page-header";
import { ResourceErrorState } from "@/components/shared/resource-state";
import { MetricCard } from "@/components/ui/metric-card";
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
  const activeCount = employees.filter((employee) => employee.status === "Active").length;
  const onLeaveCount = employees.filter((employee) => employee.status === "On Leave").length;
  const inactiveCount = employees.filter((employee) => employee.status === "Inactive").length;

  return (
    <>
      <PageHeader
        eyebrow="Workforce directory"
        title="Employees"
        description="Manage employee records, payroll assignments, and workforce status from a central directory."
        actions={canAddEmployee ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="ui-badge ui-badge-neutral">{employees.length} employees</span>
            <Link href="/employees/new" className="ui-button-primary">
              Add Employee
            </Link>
          </div>
        ) : null}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          eyebrow="Total employees"
          value={String(employees.length)}
          description="Current directory records"
          tone="primary"
        />
        <MetricCard
          eyebrow="Active"
          value={String(activeCount)}
          description="Available for payroll and operations"
          tone="success"
        />
        <MetricCard
          eyebrow="On leave"
          value={String(onLeaveCount)}
          description="Temporarily away from active duty"
          tone="warning"
        />
        <MetricCard
          eyebrow="Inactive"
          value={String(inactiveCount)}
          description="Archived or separated records"
        />
      </section>

      <section className="panel p-5 sm:p-6">
        <EmployeeListToolbar
          actions={<EmployeeImportExportControls canManageEmployees={canAddEmployee} />}
        />

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
