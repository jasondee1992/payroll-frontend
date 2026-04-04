import Link from "next/link";
import { AttendanceWorkspace } from "@/components/attendance/attendance-workspace";
import { PageHeader } from "@/components/shared/page-header";
import { canDeleteAttendanceCutoffs } from "@/lib/auth/session";
import { getServerAuthSession } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const session = await getServerAuthSession();
  const canManageUploadedCutoffs = canDeleteAttendanceCutoffs(session.role);

  return (
    <>
      <PageHeader
        title="Attendance"
        description="Manage attendance cutoffs, review imported logs, and resolve employee attendance requests before payroll is finalized."
        actions={
          canManageUploadedCutoffs ? (
            <Link href="/settings" className="ui-button-secondary">
              Manage uploaded cutoffs
            </Link>
          ) : null
        }
      />
      <AttendanceWorkspace
        currentRole={session.role}
        currentUsername={session.username}
      />
    </>
  );
}
