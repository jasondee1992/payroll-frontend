import { Clock3, FileWarning, TimerReset, UserRoundX } from "lucide-react";
import { AttendanceTable } from "@/components/attendance/attendance-table";
import { EmployeeAttendanceDashboard } from "@/components/attendance/employee-attendance-dashboard";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import {
  ResourceEmptyState,
  ResourceErrorState,
} from "@/components/shared/resource-state";
import { getAttendanceRecordsResource } from "@/lib/api/attendance";
import {
  buildEmployeeFullName,
  getEmployeeRecordsResource,
} from "@/lib/api/employees";
import { getServerAuthSession } from "@/lib/auth/server-session";
import { employeeAttendanceHistory } from "@/lib/mock/employee-attendance";
import { getPayrollPeriodRecordsResource } from "@/lib/api/payroll";
import { formatDate, formatTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const session = await getServerAuthSession();

  if (session.role === "employee") {
    return <EmployeeAttendanceDashboard months={employeeAttendanceHistory} />;
  }

  const [attendanceResult, employeesResult, periodsResult] = await Promise.all([
    getAttendanceRecordsResource(),
    getEmployeeRecordsResource(),
    getPayrollPeriodRecordsResource(),
  ]);

  const errorMessages = [
    attendanceResult.errorMessage,
    employeesResult.errorMessage,
    periodsResult.errorMessage,
  ].filter(Boolean);

  if (errorMessages.length > 0) {
    return (
      <>
        <PageHeader
          title="Attendance"
          description="Review attendance records, payroll exceptions, and import activity for the selected payroll period."
        />

        <ResourceErrorState
          title="Unable to load attendance from the backend"
          description={errorMessages.join(" ")}
        />
      </>
    );
  }

  const employeesById = new Map(
    employeesResult.data.map((employee) => [employee.id, employee]),
  );
  const activePeriod =
    periodsResult.data.find((period) => period.status.trim().toLowerCase() === "open") ??
    periodsResult.data[0];
  const attendanceRows = attendanceResult.data.map((record) => {
    const employee = employeesById.get(record.employee_id);

    return {
      employeeId: employee?.employee_code ?? `EMP-${record.employee_id}`,
      employeeName: employee ? buildEmployeeFullName(employee) : "Unknown employee",
      workDate: formatDate(record.work_date),
      timeIn: formatTime(record.time_in),
      timeOut: formatTime(record.time_out),
      lateMinutes: record.late_minutes,
      undertimeMinutes: record.undertime_minutes,
      overtimeMinutes: record.overtime_minutes,
      remarks: record.remarks ?? (record.absence_flag ? "Absent" : "No remarks"),
    };
  });

  const employeesWithLate = attendanceResult.data.filter(
    (record) => record.late_minutes > 0,
  ).length;
  const employeesWithOvertime = attendanceResult.data.filter(
    (record) => record.overtime_minutes > 0,
  ).length;
  const missingEntries = attendanceResult.data.filter((record) => {
    return record.absence_flag || !record.time_in || !record.time_out;
  }).length;

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
              Attendance rows below are loaded from the live attendance endpoint
              and mapped to employee records before payroll review.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Active Payroll Period
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {activePeriod?.period_name ?? "No payroll period available"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Records"
          value={String(attendanceResult.data.length)}
          detail="Attendance rows currently available from the backend."
          trend={`${employeesResult.data.length} employees`}
          trendTone="positive"
          icon={Clock3}
        />
        <StatCard
          title="Employees with Late"
          value={String(employeesWithLate)}
          detail="Attendance rows with positive late minutes."
          trend={
            attendanceResult.data.length > 0
              ? `${Math.round((employeesWithLate / attendanceResult.data.length) * 100)}%`
              : "0%"
          }
          trendTone={employeesWithLate > 0 ? "attention" : "positive"}
          icon={FileWarning}
        />
        <StatCard
          title="Employees with Overtime"
          value={String(employeesWithOvertime)}
          detail="Attendance rows with positive overtime minutes."
          trend="Live attendance data"
          trendTone="positive"
          icon={TimerReset}
        />
        <StatCard
          title="Missing Time Entries"
          value={String(missingEntries)}
          detail="Rows missing a time-in/time-out value or explicitly flagged absent."
          trend={missingEntries > 0 ? "Needs review" : "Clear"}
          trendTone={missingEntries > 0 ? "attention" : "positive"}
          icon={UserRoundX}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.7fr_0.9fr]">
        <DashboardSection
          title="Attendance records"
          description="Daily attendance entries loaded from the backend."
        >
          {attendanceRows.length > 0 ? (
            <AttendanceTable records={attendanceRows} />
          ) : (
            <ResourceEmptyState
              title="No attendance records found"
              description="Attendance rows will appear here once the backend has logs to return."
            />
          )}
        </DashboardSection>

        <DashboardSection
          title="Import history"
          description="Attendance import history is not exposed by the current backend API."
        >
          <ResourceEmptyState
            title="No import-history endpoint available"
            description="The frontend mock upload history was removed. Add a backend route for attendance import jobs if this panel should return."
          />
        </DashboardSection>
      </section>
    </>
  );
}
