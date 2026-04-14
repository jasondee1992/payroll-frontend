import { DashboardSnapshotView } from "@/components/dashboard/dashboard-snapshot-view";
import { PageHeader } from "@/components/shared/page-header";
import { ResourceErrorState } from "@/components/shared/resource-state";
import { getDashboardSnapshotResource } from "@/lib/api/dashboard";
import { getServerAuthSession } from "@/lib/auth/server-session";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [session, dashboardResult] = await Promise.all([
    getServerAuthSession(),
    getDashboardSnapshotResource(),
  ]);

  if (dashboardResult.errorMessage || dashboardResult.data == null) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          description="Monitor live operational status, immediate blockers, and next-step work from one internal workspace."
        />

        <ResourceErrorState
          title="Unable to build the dashboard from live backend data"
          description={
            dashboardResult.errorMessage ??
            "The dashboard snapshot is currently unavailable. Reporting views are separate and are not used as a fallback for dashboard operations."
          }
        />
      </>
    );
  }

  const snapshot = dashboardResult.data;

  return (
    <>
      <PageHeader
        eyebrow="Operations dashboard"
        title={snapshot.title}
        description={snapshot.description}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="ui-badge ui-badge-neutral">
              {snapshot.role.replace("-", " ").replace(/\b\w/g, (character) => character.toUpperCase())}
            </span>
            <span className="ui-badge bg-slate-900 text-white ring-slate-900/10">
              Live snapshot {formatDateTime(snapshot.generated_at)}
            </span>
          </div>
        }
      />

      <DashboardSnapshotView
        snapshot={snapshot}
        currentRole={session.role}
      />
    </>
  );
}
