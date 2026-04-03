import { PlannedModulePlaceholder } from "@/components/shared/planned-module-placeholder";
import { PageHeader } from "@/components/shared/page-header";
import { ResourceEmptyState } from "@/components/shared/resource-state";
import { getServerAuthSession } from "@/lib/auth/server-session";

export default async function PayslipsPage() {
  const session = await getServerAuthSession();

  if (session.role === "finance") {
    return (
      <PlannedModulePlaceholder
        title="Payslips"
        description="Finance payslips space reserved for the release and statement views we will define next."
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Payslips"
        description="Preview employee payslips, review recent releases, and prepare export or download actions for payroll statements."
      />

      <section className="panel p-6 sm:p-7">
        <ResourceEmptyState
          title="Payslip data is unavailable"
          description="The previous mock payslip preview and recent-payslips table were removed. The current backend does not expose a payslips endpoint yet, so this page now waits for a real API contract."
        />
      </section>
    </>
  );
}
