import { HolidayCalendarWorkspace } from "@/components/holidays/holiday-calendar-workspace";
import { PageHeader } from "@/components/shared/page-header";
import { ResourceEmptyState } from "@/components/shared/resource-state";
import {
  canManageHolidayCalendar,
  canViewHolidayCalendar,
} from "@/lib/auth/session";
import { getServerAuthSession } from "@/lib/auth/server-session";

export default async function HolidaysPage() {
  const session = await getServerAuthSession();
  const canManage = canManageHolidayCalendar(session.role);

  if (!canViewHolidayCalendar(session.role)) {
    return (
      <>
        <PageHeader
          title="Holiday Calendar"
          description="Configure the holiday calendar used by payroll and attendance workflows."
        />

        <section className="panel p-6 sm:p-7">
          <ResourceEmptyState
            title="Holiday calendar access is unavailable"
            description="This workspace is currently assigned to Admin, Admin-Finance, Finance, and HR roles."
          />
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Holiday Calendar"
        description="Maintain the operating holiday calendar for payroll, attendance review, and organization-specific non-working days."
      />

      <HolidayCalendarWorkspace canManage={canManage} />
    </>
  );
}
