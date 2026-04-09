import { NotificationsWorkspace } from "@/components/notifications/notifications-workspace";
import { PageHeader } from "@/components/shared/page-header";

export default function NotificationsPage() {
  return (
    <>
      <PageHeader
        title="Notifications"
        description="Track important payroll, attendance, request, and account action items from the in-app notification inbox."
        eyebrow="Operational alerts"
      />

      <NotificationsWorkspace />
    </>
  );
}
