import { ExceptionDashboardView } from "@/components/exceptions/exception-dashboard-view";
import { PageHeader } from "@/components/shared/page-header";
import {
  ResourceEmptyState,
  ResourceErrorState,
} from "@/components/shared/resource-state";
import { getExceptionDashboardResource } from "@/lib/api/exceptions";
import {
  canViewExceptionDashboard,
} from "@/lib/auth/session";
import { getServerAuthSession } from "@/lib/auth/server-session";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ExceptionsPage() {
  const session = await getServerAuthSession();

  if (!canViewExceptionDashboard(session.role)) {
    return (
      <>
        <PageHeader
          title="Exception Dashboard"
          description="Review operational blockers and payroll-validation issues before the cycle is finalized."
          eyebrow="Operational exceptions"
        />

        <section className="panel p-6 sm:p-7">
          <ResourceEmptyState
            title="Exception dashboard access is unavailable"
            description="This workspace is currently assigned to Admin, Admin-Finance, Finance, and HR roles."
          />
        </section>
      </>
    );
  }

  const exceptionResult = await getExceptionDashboardResource();

  if (exceptionResult.errorMessage || exceptionResult.data == null) {
    return (
      <>
        <PageHeader
          title="Exception Dashboard"
          description="Review operational blockers and payroll-validation issues before the cycle is finalized."
          eyebrow="Operational exceptions"
        />

        <ResourceErrorState
          title="Unable to load the exception dashboard"
          description={
            exceptionResult.errorMessage ??
            "The exception dashboard is currently unavailable from the backend."
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Exception Dashboard"
        description="Surface attendance gaps, approval queues, payroll setup issues, and other blockers that should be reviewed before payroll is finalized."
        eyebrow="Operational exceptions"
        actions={
          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
            Live snapshot {formatDateTime(exceptionResult.data.generated_at)}
          </span>
        }
      />

      <ExceptionDashboardView dashboard={exceptionResult.data} />
    </>
  );
}
