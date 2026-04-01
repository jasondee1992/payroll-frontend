import { PageHeader } from "@/components/shared/page-header";
import { ResourceEmptyState } from "@/components/shared/resource-state";

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        description="Prepare payroll, attendance, and workforce reporting outputs for internal review and export."
      />

      <section className="panel p-6 sm:p-7">
        <ResourceEmptyState
          title="Reports API not available"
          description="The mock report cards, filters, and preview were removed. This frontend now waits for a real backend reporting endpoint instead of showing placeholder numbers."
        />
      </section>
    </>
  );
}
