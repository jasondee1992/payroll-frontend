import { AttendanceWorkspace } from "@/components/attendance/attendance-workspace";
import { PageHeader } from "@/components/shared/page-header";
import { getServerAuthSession } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const session = await getServerAuthSession();

  return (
    <>
      <PageHeader
        title="Attendance"
        description="Manage attendance cutoffs, review imported logs, and resolve employee attendance requests before payroll is finalized."
      />
      <AttendanceWorkspace
        currentRole={session.role}
        currentUsername={session.username}
      />
    </>
  );
}
