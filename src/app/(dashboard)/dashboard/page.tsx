import {
  Activity,
  BadgeCheck,
  CalendarClock,
  Users,
} from "lucide-react";
import { ActivityTable } from "@/components/dashboard/activity-table";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { DateList } from "@/components/dashboard/date-list";
import { QuickActionsPanel } from "@/components/dashboard/quick-actions-panel";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageIntro } from "@/components/shared/page-intro";
import {
  ResourceEmptyState,
  ResourceErrorState,
} from "@/components/shared/resource-state";
import { getAttendanceRecordsResource } from "@/lib/api/attendance";
import { buildEmployeeFullName, getEmployeeRecordsResource } from "@/lib/api/employees";
import {
  getPayrollPeriodRecordsResource,
  getPayrollRunRecordsResource,
  normalizePayrollStatus,
} from "@/lib/api/payroll";
import { formatCompactCurrency, formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [employeesResult, periodsResult, runsResult, attendanceResult] =
    await Promise.all([
      getEmployeeRecordsResource(),
      getPayrollPeriodRecordsResource(),
      getPayrollRunRecordsResource(),
      getAttendanceRecordsResource(),
    ]);

  const errorMessages = [
    employeesResult.errorMessage,
    periodsResult.errorMessage,
    runsResult.errorMessage,
    attendanceResult.errorMessage,
  ].filter(Boolean);

  if (errorMessages.length > 0) {
    return (
      <>
        <PageIntro
          title="Dashboard"
          description="Monitor payroll readiness, workforce administration, and key operational actions from a single internal workspace."
        />

        <ResourceErrorState
          title="Unable to build the dashboard from live backend data"
          description={errorMessages.join(" ")}
        />
      </>
    );
  }

  const employeeById = new Map(
    employeesResult.data.map((employee) => [employee.id, employee]),
  );
  const sortedPeriods = [...periodsResult.data].sort((left, right) =>
    right.period_start.localeCompare(left.period_start),
  );
  const activePeriod =
    sortedPeriods.find((period) => period.status.trim().toLowerCase() === "open") ??
    sortedPeriods[0];
  const sortedRuns = [...runsResult.data].sort((left, right) =>
    right.created_at.localeCompare(left.created_at),
  );
  const now = new Date();
  const currentMonthRunCount = sortedRuns.filter((run) => {
    const runDate = new Date(run.created_at);

    return (
      runDate.getMonth() === now.getMonth() &&
      runDate.getFullYear() === now.getFullYear()
    );
  }).length;

  const pendingRunCount = sortedRuns.filter((run) => {
    const status = normalizePayrollStatus(run.status);
    return (
      status === "Needs review" ||
      status === "Open" ||
      status === "Draft" ||
      status === "Processing"
    );
  }).length;
  const missingAttendanceCount = attendanceResult.data.filter((record) => {
    return record.absence_flag || !record.time_in || !record.time_out;
  }).length;
  const readyEmployees = employeesResult.data.filter((employee) => employee.is_active)
    .length;
  const employeesNeedingUpdate = employeesResult.data.length - readyEmployees;
  const estimatedGrossPayroll = sortedRuns.reduce((total, run) => {
    return total + Number(run.gross_pay);
  }, 0);

  const activityItems = sortedRuns.slice(0, 4).map((run) => {
    const employee = employeeById.get(run.employee_id);
    const period = sortedPeriods.find((item) => item.id === run.payroll_period_id);

    return {
      id: String(run.id),
      period: period?.period_name ?? `Payroll Period ${run.payroll_period_id}`,
      runType: employee ? buildEmployeeFullName(employee) : `Employee #${run.employee_id}`,
      processedOn: formatDate(run.created_at),
      employees: "1 employee",
      amount: formatCurrency(run.gross_pay),
      status: normalizePayrollStatus(run.status),
    };
  });

  const upcomingDates = activePeriod
    ? [
        {
          label: "Period start",
          date: formatDate(activePeriod.period_start),
          note: `${activePeriod.period_name} started on the backend-defined payroll calendar.`,
        },
        {
          label: "Period end",
          date: formatDate(activePeriod.period_end),
          note: "Attendance and payroll adjustments should be complete by this cutoff.",
        },
        {
          label: "Payout date",
          date: formatDate(activePeriod.payout_date),
          note: "This is the configured release date for the active payroll period.",
        },
      ]
    : [];

  const alerts = [
    pendingRunCount > 0
      ? {
          title: `${pendingRunCount} payroll records still need action`,
          description:
            "Live payroll runs include records that are still open, processing, or need review.",
          tone: "warning" as const,
        }
      : null,
    missingAttendanceCount > 0
      ? {
          title: `${missingAttendanceCount} attendance records need correction`,
          description:
            "Some attendance logs are missing time-in/time-out values or are flagged absent.",
          tone: "info" as const,
        }
      : null,
    employeesNeedingUpdate > 0
      ? {
          title: `${employeesNeedingUpdate} employees are not active`,
          description:
            "Employee records marked inactive or pending may need updates before payroll processing.",
          tone: "neutral" as const,
        }
      : null,
  ].filter((alert): alert is NonNullable<typeof alert> => alert !== null);

  return (
    <>
      <PageIntro
        title="Dashboard"
        description="Monitor payroll readiness, workforce administration, and key operational actions from a single internal workspace."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={String(employeesResult.data.length)}
          detail="This count is loaded directly from the employees list endpoint."
          trend={`${readyEmployees} active`}
          trendTone="positive"
          icon={Users}
        />
        <StatCard
          title="Active Payroll Period"
          value={activePeriod?.period_name ?? "No period"}
          detail={
            activePeriod
              ? `Current backend status: ${normalizePayrollStatus(activePeriod.status)}.`
              : "No payroll period is currently available from the backend."
          }
          trend={
            activePeriod ? normalizePayrollStatus(activePeriod.status) : "Unavailable"
          }
          icon={CalendarClock}
        />
        <StatCard
          title="Payroll Runs This Month"
          value={String(currentMonthRunCount)}
          detail="Count of payroll run records created during the current calendar month."
          trend={`${sortedRuns.length} total`}
          trendTone="positive"
          icon={Activity}
        />
        <StatCard
          title="Pending Run Actions"
          value={String(pendingRunCount)}
          detail="Runs in open, draft, processing, or review-required states."
          trend={pendingRunCount > 0 ? "Action needed" : "Clear"}
          trendTone={pendingRunCount > 0 ? "attention" : "positive"}
          icon={BadgeCheck}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <DashboardSection
          title="Recent payroll activity"
          description="Most recent payroll run records from the backend."
          action={
            activePeriod ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {activePeriod.period_name}
              </span>
            ) : null
          }
        >
          {activityItems.length > 0 ? (
            <ActivityTable items={activityItems} />
          ) : (
            <ResourceEmptyState
              title="No payroll runs found"
              description="Payroll activity will appear here once the backend has payroll run records."
            />
          )}
        </DashboardSection>

        <div className="grid gap-4">
          <DashboardSection
            title="Quick actions"
            description="Jump directly into the most common payroll administration tasks."
          >
            <QuickActionsPanel />
          </DashboardSection>

          <DashboardSection
            title="Upcoming payroll dates"
            description="Critical backend-defined milestones for the active cycle."
          >
            {upcomingDates.length > 0 ? (
              <DateList items={upcomingDates} />
            ) : (
              <ResourceEmptyState
                title="No payroll dates available"
                description="Create a payroll period in the backend to populate this schedule."
              />
            )}
          </DashboardSection>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <DashboardSection
          title="Notifications and alerts"
          description="Live items that need attention before payroll is finalized."
        >
          {alerts.length > 0 ? (
            <AlertsPanel items={alerts} />
          ) : (
            <ResourceEmptyState
              title="No active alerts"
              description="The current backend data does not expose any review, attendance, or employee-status exceptions."
            />
          )}
        </DashboardSection>

        <DashboardSection
          title="Processing overview"
          description="Operational snapshot derived from the current backend records."
        >
          <div className="grid gap-3">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
              <p className="text-sm font-medium text-slate-500">Ready employees</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {readyEmployees}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
              <p className="text-sm font-medium text-slate-500">
                Attendance exceptions
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {missingAttendanceCount}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
              <p className="text-sm font-medium text-slate-500">
                Estimated gross payroll
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {formatCompactCurrency(estimatedGrossPayroll)}
              </p>
            </div>
          </div>
        </DashboardSection>
      </section>
    </>
  );
}
