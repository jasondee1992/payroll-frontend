import { Clock3, FileWarning, TimerReset, UserRoundX } from "lucide-react";
import { AttendanceTable } from "@/components/attendance/attendance-table";
import { UploadHistoryPanel } from "@/components/attendance/upload-history-panel";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/shared/page-header";

const attendanceRecords = [
  {
    employeeId: "EMP-1001",
    employeeName: "Olivia Bennett",
    workDate: "Apr 01, 2026",
    timeIn: "8:07 AM",
    timeOut: "5:42 PM",
    lateMinutes: 7,
    undertimeMinutes: 0,
    overtimeMinutes: 35,
    remarks: "Approved overtime",
  },
  {
    employeeId: "EMP-1008",
    employeeName: "Marcus Rivera",
    workDate: "Apr 01, 2026",
    timeIn: "8:23 AM",
    timeOut: "5:01 PM",
    lateMinutes: 23,
    undertimeMinutes: 0,
    overtimeMinutes: 0,
    remarks: "Late arrival due to client visit",
  },
  {
    employeeId: "EMP-1015",
    employeeName: "Sophia Turner",
    workDate: "Apr 01, 2026",
    timeIn: "8:00 AM",
    timeOut: "4:48 PM",
    lateMinutes: 0,
    undertimeMinutes: 12,
    overtimeMinutes: 0,
    remarks: "Left early with manager approval",
  },
  {
    employeeId: "EMP-1022",
    employeeName: "Daniel Kim",
    workDate: "Apr 01, 2026",
    timeIn: "7:56 AM",
    timeOut: "6:14 PM",
    lateMinutes: 0,
    undertimeMinutes: 0,
    overtimeMinutes: 74,
    remarks: "Sprint deployment support",
  },
  {
    employeeId: "EMP-1031",
    employeeName: "Priya Shah",
    workDate: "Apr 01, 2026",
    timeIn: "--",
    timeOut: "--",
    lateMinutes: 0,
    undertimeMinutes: 0,
    overtimeMinutes: 0,
    remarks: "Missing time entry",
  },
  {
    employeeId: "EMP-1044",
    employeeName: "Ethan Walker",
    workDate: "Apr 01, 2026",
    timeIn: "9:11 AM",
    timeOut: "6:03 PM",
    lateMinutes: 11,
    undertimeMinutes: 0,
    overtimeMinutes: 3,
    remarks: "Field sales meeting",
  },
];

const uploadHistory = [
  {
    fileName: "attendance_apr01_finance.csv",
    period: "Apr 01 - Apr 15, 2026",
    uploadedBy: "Payroll Admin",
    uploadedAt: "Apr 01, 2026 9:12 AM",
    records: "84 records",
    status: "Imported" as const,
  },
  {
    fileName: "attendance_apr01_operations.xlsx",
    period: "Apr 01 - Apr 15, 2026",
    uploadedBy: "Marcus Rivera",
    uploadedAt: "Apr 01, 2026 8:46 AM",
    records: "112 records",
    status: "Validated" as const,
  },
  {
    fileName: "attendance_apr01_support.csv",
    period: "Apr 01 - Apr 15, 2026",
    uploadedBy: "Support Lead",
    uploadedAt: "Apr 01, 2026 8:05 AM",
    records: "36 records",
    status: "Needs review" as const,
  },
];

export default function AttendancePage() {
  return (
    <>
      <PageHeader
        title="Attendance"
        description="Review attendance records, payroll exceptions, and import activity for the selected payroll period."
        actions={
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/15"
          >
            Upload Attendance
          </button>
        }
      />

      <section className="panel p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Processing note
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Attendance records for the active period are used to compute late,
              undertime, and overtime adjustments before payroll approval.
            </p>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Selected Payroll Period
            </span>
            <select
              defaultValue="Apr 01 - Apr 15, 2026"
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
            >
              <option>Apr 01 - Apr 15, 2026</option>
              <option>Mar 16 - Mar 31, 2026</option>
              <option>Mar 01 - Mar 15, 2026</option>
            </select>
          </label>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Records"
          value="232"
          detail="Attendance rows imported and ready for payroll review in the current period."
          trend="+18 today"
          trendTone="positive"
          icon={Clock3}
        />
        <StatCard
          title="Employees with Late"
          value="21"
          detail="Employees with recorded late time entries that may affect payroll deductions."
          trend="9.1%"
          trendTone="attention"
          icon={FileWarning}
        />
        <StatCard
          title="Employees with Overtime"
          value="34"
          detail="Approved or review-pending overtime records detected for the active cycle."
          trend="+7 today"
          trendTone="positive"
          icon={TimerReset}
        />
        <StatCard
          title="Missing Time Entries"
          value="6"
          detail="Records still require manual correction or attendance re-upload before closing."
          trend="Needs review"
          trendTone="attention"
          icon={UserRoundX}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.7fr_0.9fr]">
        <DashboardSection
          title="Attendance records"
          description="Daily attendance entries prepared for payroll adjustment review."
        >
          <AttendanceTable records={attendanceRecords} />
        </DashboardSection>

        <DashboardSection
          title="Import history"
          description="Recent attendance uploads and validation outcomes for the selected period."
        >
          <UploadHistoryPanel items={uploadHistory} />
        </DashboardSection>
      </section>
    </>
  );
}
