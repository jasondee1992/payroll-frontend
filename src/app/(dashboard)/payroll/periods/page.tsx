import { PayrollPeriodsTable } from "@/components/payroll/payroll-periods-table";
import { PageHeader } from "@/components/shared/page-header";

const periods = [
  {
    id: "PER-2026-04",
    periodName: "April 2026 Monthly Payroll",
    startDate: "Apr 01, 2026",
    endDate: "Apr 30, 2026",
    payoutDate: "May 05, 2026",
    status: "Open" as const,
  },
  {
    id: "PER-2026-03-OFF",
    periodName: "March 2026 Off-cycle Adjustments",
    startDate: "Mar 21, 2026",
    endDate: "Mar 21, 2026",
    payoutDate: "Mar 23, 2026",
    status: "Completed" as const,
  },
  {
    id: "PER-2026-03",
    periodName: "March 2026 Monthly Payroll",
    startDate: "Mar 01, 2026",
    endDate: "Mar 31, 2026",
    payoutDate: "Apr 05, 2026",
    status: "Closed" as const,
  },
  {
    id: "PER-2026-05",
    periodName: "May 2026 Monthly Payroll",
    startDate: "May 01, 2026",
    endDate: "May 31, 2026",
    payoutDate: "Jun 05, 2026",
    status: "Draft" as const,
  },
];

export default function PayrollPeriodsPage() {
  return (
    <>
      <PageHeader
        title="Payroll Periods"
        description="Maintain payroll cycle windows, payout dates, and operational status across each period."
        actions={
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/15"
          >
            Create Period
          </button>
        }
      />

      <section className="panel p-5 sm:p-6">
        <PayrollPeriodsTable periods={periods} />
      </section>
    </>
  );
}

