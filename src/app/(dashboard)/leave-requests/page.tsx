import { PageHeader } from "@/components/shared/page-header";
import { RequestFilingWorkspace } from "@/components/time-requests/request-filing-workspace";
import { getCurrentEmployeeRequestContextResource } from "@/lib/api/current-employee";
import { getServerAuthSession } from "@/lib/auth/server-session";

export default async function LeaveRequestsPage() {
  const session = await getServerAuthSession();
  const { data: currentEmployeeContext, errorMessage } =
    await getCurrentEmployeeRequestContextResource(session.username);

  return (
    <>
      <PageHeader
        title="Time Requests"
        description="Centralize leave, attendance, overtime, undertime, official business, and policy-based employee requests in one operational workspace."
        eyebrow="Workforce requests"
      />
      <RequestFilingWorkspace
        currentRole={session.role}
        currentUsername={session.username}
        currentEmployeeContext={currentEmployeeContext}
        currentEmployeeContextErrorMessage={errorMessage}
      />
    </>
  );
}
