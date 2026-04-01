import { PageHeader } from "@/components/shared/page-header";
import { ResourceEmptyState } from "@/components/shared/resource-state";

export default function PayslipsPage() {
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
