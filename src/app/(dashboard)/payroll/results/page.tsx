import { BadgeCheck, CircleDollarSign, Landmark, WalletCards } from "lucide-react";
import { PayrollResultsTable } from "@/components/payroll/payroll-results-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import {
  ResourceEmptyState,
  ResourceErrorState,
} from "@/components/shared/resource-state";
import {
  buildEmployeeFullName,
  getEmployeeRecordsResource,
} from "@/lib/api/employees";
import {
  getPayrollPeriodRecordsResource,
  getPayrollRunRecordsResource,
  normalizePayrollStatus,
} from "@/lib/api/payroll";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PayrollResultsPage() {
  const [runsResult, employeesResult, periodsResult] = await Promise.all([
    getPayrollRunRecordsResource(),
    getEmployeeRecordsResource(),
    getPayrollPeriodRecordsResource(),
  ]);

  const errorMessages = [
    runsResult.errorMessage,
    employeesResult.errorMessage,
    periodsResult.errorMessage,
  ].filter(Boolean);

  if (errorMessages.length > 0) {
    return (
      <>
        <PageHeader
          title="Payroll Results"
          description="Review payroll outputs, validate deduction and tax totals, and prepare payroll results for downstream release."
        />

        <ResourceErrorState
          title="Unable to load payroll results"
          description={errorMessages.join(" ")}
        />
      </>
    );
  }

  const periods = [...periodsResult.data].sort((left, right) =>
    right.period_start.localeCompare(left.period_start),
  );
  const selectedPeriod =
    periods.find((period) => period.status.trim().toLowerCase() === "open") ??
    periods[0];
  const employeeById = new Map(
    employeesResult.data.map((employee) => [employee.id, employee]),
  );
  const scopedRuns = selectedPeriod
    ? runsResult.data.filter((run) => run.payroll_period_id === selectedPeriod.id)
    : runsResult.data;

  const results = scopedRuns.map((run) => {
    const employee = employeeById.get(run.employee_id);
    const deductions =
      Number(run.total_deductions) + Number(run.government_deductions);

    return {
      employeeId: employee?.employee_code ?? `EMP-${run.employee_id}`,
      name: employee ? buildEmployeeFullName(employee) : "Unknown employee",
      grossPay: formatCurrency(run.gross_pay),
      deductions: formatCurrency(deductions),
      tax: formatCurrency(run.withholding_tax),
      netPay: formatCurrency(run.net_pay),
      status: normalizePayrollStatus(run.status),
    };
  });

  const grossPayroll = scopedRuns.reduce((total, run) => {
    return total + Number(run.gross_pay);
  }, 0);
  const totalDeductions = scopedRuns.reduce((total, run) => {
    return (
      total +
      Number(run.total_deductions) +
      Number(run.government_deductions) +
      Number(run.withholding_tax)
    );
  }, 0);
  const netPayout = scopedRuns.reduce((total, run) => {
    return total + Number(run.net_pay);
  }, 0);
  const readyResults = scopedRuns.filter((run) => {
    const status = normalizePayrollStatus(run.status);
    return status === "Processed" || status === "Completed" || status === "Paid";
  }).length;
  const pendingResults = scopedRuns.length - readyResults;

  return (
    <>
      <PageHeader
        title="Payroll Results"
        description="Review payroll outputs, validate deduction and tax totals, and prepare payroll results for downstream release."
        actions={
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/10"
          >
            Export Results
          </button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Processed Employees"
          value={String(scopedRuns.length)}
          detail="Employees included in the selected backend payroll period."
          trend={`${readyResults} ready`}
          trendTone="positive"
          icon={BadgeCheck}
        />
        <StatCard
          title="Gross Payroll"
          value={formatCompactCurrency(grossPayroll)}
          detail="Total gross pay returned by the payroll-runs endpoint."
          trend={selectedPeriod?.period_name ?? "All periods"}
          trendTone="positive"
          icon={CircleDollarSign}
        />
        <StatCard
          title="Total Deductions"
          value={formatCompactCurrency(totalDeductions)}
          detail="Combined deductions, government deductions, and withholding tax."
          trend="Calculated from live runs"
          icon={Landmark}
        />
        <StatCard
          title="Net Payout"
          value={formatCompactCurrency(netPayout)}
          detail="Net pay across the currently displayed payroll results."
          trend={
            pendingResults > 0 ? `${pendingResults} pending` : "All processed"
          }
          trendTone={pendingResults > 0 ? "attention" : "positive"}
          icon={WalletCards}
        />
      </section>

      <section className="panel p-5 sm:p-6">
        {results.length > 0 ? (
          <PayrollResultsTable results={results} />
        ) : (
          <ResourceEmptyState
            title="No payroll results found"
            description="The backend returned no payroll runs for the active or latest payroll period."
          />
        )}
      </section>
    </>
  );
}
