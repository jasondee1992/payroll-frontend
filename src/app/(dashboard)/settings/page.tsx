import { PageHeader } from "@/components/shared/page-header";
import { ResourceEmptyState } from "@/components/shared/resource-state";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Keep payroll configuration, organization preferences, and access-related controls organized in one place."
      />

      <section className="panel p-6 sm:p-7">
        <ResourceEmptyState
          title="Settings API not available"
          description="Static settings placeholder content was removed. Add backend-backed settings routes before reintroducing this screen."
        />
      </section>
    </>
  );
}
