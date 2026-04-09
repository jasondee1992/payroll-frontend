import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PayrollReconciliationView } from "@/components/payroll/payroll-reconciliation-view";
import { PayrollStatusBadge } from "@/components/payroll/payroll-status-badge";
import { PageHeader } from "@/components/shared/page-header";
import {
  ResourceEmptyState,
  ResourceErrorState,
} from "@/components/shared/resource-state";
import {
  getPayrollReconciliationResource,
  normalizePayrollStatus,
} from "@/lib/api/payroll";
import { getServerAuthSession } from "@/lib/auth/server-session";
import { canViewPayroll } from "@/lib/auth/session";
import { formatDate, formatDateTime } from "@/lib/format";

type PayrollReconciliationPageProps = {
  params: Promise<{
    batchId: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function PayrollReconciliationPage({
  params,
}: PayrollReconciliationPageProps) {
  const { batchId } = await params;
  const session = await getServerAuthSession();

  if (!canViewPayroll(session.role)) {
    return (
      <>
        <PageHeader
          title="Payroll Reconciliation"
          description="Review payroll totals, comparison signals, and warnings before approval or finalization."
          eyebrow="Payroll review"
        />

        <section className="panel p-6 sm:p-7">
          <ResourceEmptyState
            title="Payroll reconciliation access is unavailable"
            description="This workspace is currently assigned to Admin, Finance, and Admin-Finance roles."
          />
        </section>
      </>
    );
  }

  const reconciliationResult = await getPayrollReconciliationResource(batchId);

  if (reconciliationResult.errorMessage || reconciliationResult.data == null) {
    return (
      <>
        <PageHeader
          title="Payroll Reconciliation"
          description="Review payroll totals, comparison signals, and warnings before approval or finalization."
          eyebrow="Payroll review"
          actions={
            <Link href="/payroll" className="ui-button-secondary gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Payroll
            </Link>
          }
        />

        <ResourceErrorState
          title="Unable to load payroll reconciliation"
          description={
            reconciliationResult.errorMessage ??
            "Payroll reconciliation data is currently unavailable from the backend."
          }
        />
      </>
    );
  }

  const reconciliation = reconciliationResult.data;

  return (
    <>
      <PageHeader
        title="Payroll Reconciliation"
        description={`Review ${formatDate(reconciliation.cutoff.cutoff_start)} to ${formatDate(reconciliation.cutoff.cutoff_end)} before the batch is approved or finalized.`}
        eyebrow="Payroll review"
        actions={
          <div className="flex flex-wrap gap-3">
            <Link href="/payroll" className="ui-button-secondary gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Payroll
            </Link>
            <div className="rounded-[24px] border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <PayrollStatusBadge
                  status={normalizePayrollStatus(reconciliation.batch_status)}
                />
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Snapshot {formatDateTime(reconciliation.generated_at)}
                </span>
              </div>
            </div>
          </div>
        }
      />

      <PayrollReconciliationView reconciliation={reconciliation} />
    </>
  );
}
