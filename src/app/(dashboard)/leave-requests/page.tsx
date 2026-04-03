import { PageHeader } from "@/components/shared/page-header";
import { RequestFilingWorkspace } from "@/components/time-requests/request-filing-workspace";

export default function LeaveRequestsPage() {
  return (
    <>
      <PageHeader
        title="Time Requests"
        description="Centralize leave, attendance, overtime, undertime, official business, and policy-based employee requests in one operational workspace."
        eyebrow="Workforce requests"
      />
      <RequestFilingWorkspace />
    </>
  );
}
