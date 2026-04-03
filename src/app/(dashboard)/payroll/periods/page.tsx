import { CreatePayrollPeriodButton } from "@/components/payroll/create-payroll-period-button";
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
        actions={<CreatePayrollPeriodButton />}
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
