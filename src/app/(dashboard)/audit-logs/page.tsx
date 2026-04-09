import { AuditLogWorkspace } from "@/components/audit-logs/audit-log-workspace";
import { PageHeader } from "@/components/shared/page-header";
import { ResourceErrorState } from "@/components/shared/resource-state";
import { getServerAuthSession } from "@/lib/auth/server-session";
import { canViewAuditLogs } from "@/lib/auth/session";

export default async function AuditLogsPage() {
  const session = await getServerAuthSession();

  return (
    <>
      <PageHeader
        title="Audit logs"
        description="Review who changed what across payroll, employees, attendance, leave, loans, adjustments, and settings. This is an operational activity trail, not a reporting workspace."
        eyebrow="Governance"
      />

      {canViewAuditLogs(session.role) ? (
        <AuditLogWorkspace role={session.role} />
      ) : (
        <section className="panel p-6 sm:p-7">
          <ResourceErrorState
            title="Audit log access is unavailable"
            description="This workspace is restricted to Admin, Admin-Finance, Finance, and HR users."
          />
        </section>
      )}
    </>
  );
}
