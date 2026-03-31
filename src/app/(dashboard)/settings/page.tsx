import { SectionPlaceholder } from "@/components/shared/section-placeholder";

export default function SettingsPage() {
  return (
    <SectionPlaceholder
      title="Settings"
      description="Keep payroll configuration, organization preferences, and access-related controls organized in one place."
      bullets={[
        "Later additions can include settings forms, approval policy management, and pay cycle configuration.",
        "Form sections can reuse the same spacing, panel, and responsive layout patterns already established.",
        "No persistence or settings API integration has been introduced in this frontend foundation.",
      ]}
    />
  );
}
