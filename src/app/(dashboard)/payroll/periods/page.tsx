import { PayrollPeriodsTable } from "@/components/payroll/payroll-periods-table";
import { PageHeader } from "@/components/shared/page-header";
import {
  ResourceEmptyState,
  ResourceErrorState,
} from "@/components/shared/resource-state";
import { getPayrollPeriodsResource } from "@/lib/api/payroll";

export const dynamic = "force-dynamic";

export default async function PayrollPeriodsPage() {
  const { data: periods, errorMessage } = await getPayrollPeriodsResource();

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
        {errorMessage ? (
          <ResourceErrorState
            title="Unable to load payroll periods"
            description={errorMessage}
          />
        ) : periods.length > 0 ? (
          <PayrollPeriodsTable periods={periods} />
        ) : (
          <ResourceEmptyState
            title="No payroll periods found"
            description="Create a payroll period in the backend to populate this page."
          />
        )}
      </section>
    </>
  );
}
