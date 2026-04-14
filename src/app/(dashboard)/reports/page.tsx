import { PayrollReportingWorkspace } from "@/components/reports/payroll-reporting-workspace";
import { PageHeader } from "@/components/shared/page-header";
import { ResourceErrorState } from "@/components/shared/resource-state";
import { getServerAuthSession } from "@/lib/auth/server-session";
import { canViewPayroll } from "@/lib/auth/session";

export default async function ReportsPage() {
  const session = await getServerAuthSession();

  return (
    <>
      <PageHeader
        title="Payroll reports"
        description="Review year-to-date payroll totals, current month processing, cutoff approval status, and statutory payroll cost breakdowns for payroll review operations."
        eyebrow="Reporting"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="ui-badge ui-badge-neutral">
              {session.role?.replace("-", " ") ?? "restricted"} role
            </span>
            <span className="ui-badge ui-badge-info">Finance reporting workspace</span>
          </div>
        }
      />

      {canViewPayroll(session.role) ? (
        <PayrollReportingWorkspace role={session.role} />
      ) : (
        <section className="panel p-6 sm:p-7">
          <ResourceErrorState
            title="Payroll reporting access is unavailable"
            description="This reporting workspace is restricted to Admin, Finance, and Admin-Finance users."
          />
        </section>
      )}
    </>
  );
}
