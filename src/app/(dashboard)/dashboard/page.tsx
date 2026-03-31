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

const payrollActivity = [
  {
    id: "pay-2026-04-primary",
    period: "April 2026 monthly payroll",
    runType: "Primary run for headquarters and regional teams",
    processedOn: "Mar 28, 2026",
    employees: "248 employees",
    amount: "$412,840.00",
    status: "In review" as const,
  },
  {
    id: "pay-2026-03-offcycle",
    period: "March 2026 off-cycle adjustments",
    runType: "Bonuses, reimbursements, and late attendance corrections",
    processedOn: "Mar 21, 2026",
    employees: "34 employees",
    amount: "$27,430.00",
    status: "Completed" as const,
  },
  {
    id: "pay-2026-03-primary",
    period: "March 2026 monthly payroll",
    runType: "Standard monthly payroll release",
    processedOn: "Mar 15, 2026",
    employees: "244 employees",
    amount: "$405,120.00",
    status: "Completed" as const,
  },
  {
    id: "pay-2026-04-scheduled",
    period: "April 2026 contractor payout",
    runType: "Scheduled supplementary run",
    processedOn: "Apr 03, 2026",
    employees: "18 employees",
    amount: "$16,880.00",
    status: "Scheduled" as const,
  },
];

const upcomingDates = [
  {
    label: "Attendance cutoff",
    date: "April 2, 2026",
    note: "Final submission deadline for timesheets and manual attendance adjustments.",
  },
  {
    label: "Payroll approval window",
    date: "April 4, 2026",
    note: "Finance and HR reviewers finalize approvals before the run is released.",
  },
  {
    label: "Payslip publication",
    date: "April 5, 2026",
    note: "Employee statements become available after payroll confirmation.",
  },
];

const alerts = [
  {
    title: "17 approvals are still pending",
    description:
      "Attendance corrections and variable pay adjustments remain in review for the active payroll period.",
    tone: "warning" as const,
  },
  {
    title: "4 bank detail changes need verification",
    description:
      "Employee payment account updates should be checked before the next payroll release is finalized.",
    tone: "info" as const,
  },
  {
    title: "Quarter-end reporting window opens this week",
    description:
      "Prepare payroll reconciliation and statutory report exports for finance review.",
    tone: "neutral" as const,
  },
];

export default function DashboardPage() {
  return (
    <>
      <PageIntro
        title="Dashboard"
        description="Monitor payroll readiness, workforce administration, and key operational actions from a single internal workspace."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Employees"
          value="248"
          detail="14 employee records were updated this week across payroll and HR administration."
          trend="+4.2%"
          trendTone="positive"
          icon={Users}
        />
        <StatCard
          title="Active Payroll Period"
          value="Apr 2026"
          detail="Monthly payroll period is open and currently in pre-approval review."
          trend="Open"
          icon={CalendarClock}
        />
        <StatCard
          title="Payroll Runs This Month"
          value="3"
          detail="Two completed runs and one scheduled supplementary contractor payout."
          trend="+1 vs last month"
          trendTone="positive"
          icon={Activity}
        />
        <StatCard
          title="Pending Approvals"
          value="17"
          detail="Manager approvals and payroll exception reviews still need resolution."
          trend="Action needed"
          trendTone="attention"
          icon={BadgeCheck}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <DashboardSection
          title="Recent payroll activity"
          description="Latest payroll runs, supplementary cycles, and review states across the current month."
          action={
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              March to April
            </span>
          }
        >
          <ActivityTable items={payrollActivity} />
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
            description="Critical payroll milestones for the active cycle."
          >
            <DateList items={upcomingDates} />
          </DashboardSection>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <DashboardSection
          title="Notifications and alerts"
          description="Items that need attention before the current payroll cycle is finalized."
        >
          <AlertsPanel items={alerts} />
        </DashboardSection>

        <DashboardSection
          title="Processing overview"
          description="Operational snapshot of the current payroll cycle."
        >
          <div className="grid gap-3">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
              <p className="text-sm font-medium text-slate-500">Ready to process</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">231 employees</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
              <p className="text-sm font-medium text-slate-500">Awaiting data updates</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">11 records</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
              <p className="text-sm font-medium text-slate-500">Estimated gross payroll</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">$412,840</p>
            </div>
          </div>
        </DashboardSection>
      </section>
    </>
  );
}
