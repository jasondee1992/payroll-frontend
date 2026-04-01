import Link from "next/link";
import {
  CalendarRange,
  FileChartColumn,
  FileText,
  PlayCircle,
} from "lucide-react";
import { PayrollModuleLinkCard } from "@/components/payroll/payroll-module-link-card";
import { PageHeader } from "@/components/shared/page-header";
import { ResourceErrorState } from "@/components/shared/resource-state";
import {
  getPayrollPeriodRecordsResource,
  getPayrollRunRecordsResource,
  normalizePayrollStatus,
} from "@/lib/api/payroll";
import { formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PayrollPage() {
  const [periodsResult, runsResult] = await Promise.all([
    getPayrollPeriodRecordsResource(),
    getPayrollRunRecordsResource(),
  ]);

  const errorMessages = [periodsResult.errorMessage, runsResult.errorMessage].filter(
    Boolean,
  );

  if (errorMessages.length > 0) {
    return (
      <>
        <PageHeader
          title="Payroll"
          description="Manage payroll cycles, run processing steps, review results, and move through the payroll workflow from one module."
        />

        <ResourceErrorState
          title="Unable to load payroll module data"
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
  const activePeriodRuns = activePeriod
    ? runsResult.data.filter((run) => run.payroll_period_id === activePeriod.id)
    : [];
  const grossPayout = activePeriodRuns.reduce((total, run) => {
    return total + Number(run.gross_pay);
  }, 0);

  return (
    <>
      <PageHeader
        title="Payroll"
        description="Manage payroll cycles, run processing steps, review results, and move through the payroll workflow from one module."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PayrollModuleLinkCard
          title="Payroll Periods"
          description="Create, review, and manage active and upcoming pay cycles."
          href="/payroll/periods"
          icon={CalendarRange}
          meta={`${periods.length} periods`}
        />
        <PayrollModuleLinkCard
          title="Run Payroll"
          description="Prepare a payroll run with the selected period and backend-defined scope."
          href="/payroll/run"
          icon={PlayCircle}
          meta={activePeriod ? normalizePayrollStatus(activePeriod.status) : "No period"}
        />
        <PayrollModuleLinkCard
          title="Payroll Results"
          description="Review gross pay, deductions, tax, and final net pay outcomes."
          href="/payroll/results"
          icon={FileChartColumn}
          meta={`${runsResult.data.length} runs`}
        />
        <PayrollModuleLinkCard
          title="Payslips"
          description="Move to payslip publishing and employee-facing payroll statement records."
          href="/payslips"
          icon={FileText}
          meta="No backend route"
        />
      </section>

      <section className="panel p-6 sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Current payroll cycle
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {activePeriod
                ? `${activePeriod.period_name} runs from ${formatDate(activePeriod.period_start)} to ${formatDate(activePeriod.period_end)} with payout scheduled for ${formatDate(activePeriod.payout_date)}. Current live gross payout across recorded runs is ${formatCurrency(grossPayout)}.`
                : "No payroll period is currently available from the backend."}
            </p>
          </div>
          <Link
            href="/payroll/run"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Continue Payroll Run
          </Link>
        </div>
      </section>
    </>
  );
}
