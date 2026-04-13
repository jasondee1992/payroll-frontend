import { AdminFinanceSettingsTabs } from "@/components/settings/admin-finance-settings-tabs";
import { SystemBrandingSettings } from "@/components/settings/system-branding-settings";
import { PlannedModulePlaceholder } from "@/components/shared/planned-module-placeholder";
import { PageHeader } from "@/components/shared/page-header";
import { ResourceEmptyState } from "@/components/shared/resource-state";
import { getBrandingResource, resolveBrandingAssetUrl } from "@/lib/api/branding";
import { getServerAuthSession } from "@/lib/auth/server-session";

export default async function SettingsPage() {
  const [session, brandingResult] = await Promise.all([
    getServerAuthSession(),
    getBrandingResource(),
  ]);

  if (session.role === "system-admin") {
    return (
      <>
        <PageHeader
          title="Settings"
          description="Configure company branding, login visuals, and workspace identity for the client deployment."
        />

        <SystemBrandingSettings
          initialBranding={brandingResult.data}
          companyLogoUrl={resolveBrandingAssetUrl(brandingResult.data.companyLogoPath)}
          loginBackgroundUrl={resolveBrandingAssetUrl(
            brandingResult.data.loginBackgroundPath,
          )}
        />
      </>
    );
  }

  if (session.role === "admin-finance") {
    return (
      <>
        <PageHeader
          title="Settings"
          description="Manage payroll deduction settings and saved attendance cutoff uploads for the Admin-Finance workflow."
        />

        <AdminFinanceSettingsTabs />
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
