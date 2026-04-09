import { PayrollBatchWorkspace } from "@/components/payroll/payroll-batch-workspace";
import { PageHeader } from "@/components/shared/page-header";
import { ResourceErrorState } from "@/components/shared/resource-state";
import { getServerAuthSession } from "@/lib/auth/server-session";
import { canViewPayroll } from "@/lib/auth/session";

export default async function PayrollPage() {
  const session = await getServerAuthSession();

  return (
    <>
      <PageHeader
        title="Payroll"
        description="Review cutoff readiness, manage manual payroll adjustments, inspect employee-by-employee breakdowns, and move payroll forward with explicit approvals."
      />

      {canViewPayroll(session.role) ? (
        <PayrollBatchWorkspace role={session.role} />
      ) : (
        <section className="panel p-6 sm:p-7">
          <ResourceErrorState
            title="Payroll access is unavailable"
            description="This payroll workflow is restricted to Admin, Finance, and Admin-Finance users."
          />
        </section>
      )}
    </>
  );
}
