import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { PayrollRunForm } from "@/components/payroll/payroll-run-form";
import { PageHeader } from "@/components/shared/page-header";
import {
  ResourceEmptyState,
  ResourceErrorState,
} from "@/components/shared/resource-state";
import { getAttendanceRecordsResource } from "@/lib/api/attendance";
import { getEmployeeRecordsResource } from "@/lib/api/employees";
import { getPayrollPeriodRecordsResource } from "@/lib/api/payroll";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PayrollRunPage() {
  const [periodsResult, employeesResult, attendanceResult] = await Promise.all([
    getPayrollPeriodRecordsResource(),
    getEmployeeRecordsResource(),
    getAttendanceRecordsResource(),
  ]);

  const errorMessages = [
    periodsResult.errorMessage,
    employeesResult.errorMessage,
    attendanceResult.errorMessage,
  ].filter(Boolean);

  if (errorMessages.length > 0) {
    return (
      <>
        <PageHeader
          title="Run Payroll"
          description="Prepare a payroll run by selecting the period, scope, and notes before moving to confirmation."
        />

        <ResourceErrorState
          title="Unable to prepare payroll run setup"
          description={errorMessages.join(" ")}
        />
      </>
    );
  }

  const periods = [...periodsResult.data].sort((left, right) =>
    right.period_start.localeCompare(left.period_start),
  );
  const activePeriod =
    periods.find((period) => period.status.trim().toLowerCase() === "open") ??
    periods[0];
  const activeEmployees = employeesResult.data.filter((employee) => employee.is_active);
  const activeEmployeeIds = activeEmployees.map((employee) => employee.id);

  const processingItems = [
    {
      label: "Employees included",
      value: `${activeEmployees.length} active employees`,
    },
    {
      label: "Payroll period",
      value: activePeriod
        ? `${activePeriod.period_name} (${formatDate(activePeriod.period_start)} to ${formatDate(activePeriod.period_end)})`
        : "No payroll period available",
    },
    {
      label: "Attendance records",
      value: `${attendanceResult.data.length} rows available from the attendance endpoint`,
    },
    {
      label: "Backend process scope",
      value: "Current backend process route handles one employee per request",
    },
    {
      label: "Estimated batch value",
      value: "Not available from current backend endpoints",
    },
  ];

  return (
    <>
      <PageHeader
        title="Run Payroll"
        description="Prepare a payroll run by selecting the period, scope, and notes before moving to confirmation."
      />

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.9fr]">
        <DashboardSection
          title="Payroll run setup"
          description="Choose the payroll period exposed by the backend before processing."
        >
          {periods.length > 0 ? (
            <PayrollRunForm
              periodOptions={periods.map((period) => ({
                id: period.id,
                label: period.period_name,
              }))}
              defaultPeriodId={activePeriod?.id}
              employeeIds={activeEmployeeIds}
            />
          ) : (
            <ResourceEmptyState
              title="No payroll periods available"
              description="Create a payroll period in the backend before attempting a payroll run."
            />
          )}
        </DashboardSection>

        <div className="space-y-4">
          <DashboardSection
            title="Processing summary"
            description="Overview of the live backend data available to this run screen."
          >
            <div className="grid gap-3">
              {processingItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </DashboardSection>

          <DashboardSection
            title="Confirmation note"
            description="Current backend capability for payroll execution."
          >
            <p className="text-sm leading-6 text-slate-600">
              This screen now uses live payroll-period, employee, and attendance
              data. Batch execution is handled in the frontend by calling the
              backend payroll-process endpoint once per included employee.
            </p>
          </DashboardSection>
        </div>
      </section>
    </>
  );
}
