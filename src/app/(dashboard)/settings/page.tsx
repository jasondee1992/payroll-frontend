import { AttendanceCutoffManager } from "@/components/settings/attendance-cutoff-manager";
import { PlannedModulePlaceholder } from "@/components/shared/planned-module-placeholder";
import { PageHeader } from "@/components/shared/page-header";
import { ResourceEmptyState } from "@/components/shared/resource-state";
import { getServerAuthSession } from "@/lib/auth/server-session";

export default async function SettingsPage() {
  const session = await getServerAuthSession();

  if (session.role === "admin-finance") {
    return (
      <>
        <PageHeader
          title="Settings"
          description="Manage saved attendance cutoff uploads here so incorrect periods can be deleted and replaced with the right file."
        />

        <AttendanceCutoffManager />
      </>
    );
  }

  if (session.role === "hr") {
    return (
      <PlannedModulePlaceholder
        title="Settings"
        description="HR settings space reserved for the controls and setup screens we still need to define."
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Keep payroll configuration, organization preferences, and access-related controls organized in one place."
      />

      <section className="panel p-6 sm:p-7">
        <ResourceEmptyState
          title="No settings module for this role"
          description="The attendance cutoff cleanup screen is currently assigned to the Admin-Finance role."
        />
      </section>
    </>
  );
}
