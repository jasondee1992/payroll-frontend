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
        description="Review year-to-date payroll totals, current month processing, cutoff approval status, and statutory payroll cost breakdowns for Admin-Finance operations."
        eyebrow="Reporting"
      />

      {canViewPayroll(session.role) ? (
        <PayrollReportingWorkspace role={session.role} />
      ) : (
        <section className="panel p-6 sm:p-7">
          <ResourceErrorState
            title="Payroll reporting access is unavailable"
            description="This reporting workspace is restricted to Finance and Admin-Finance users."
          />
        </section>
      )}
    </>
  );
}
