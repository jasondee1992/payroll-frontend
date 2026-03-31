import { DetailItem } from "@/components/ui/detail-item";
import {
  DataTableBodyCell,
  DataTableHeaderCell,
  DataTableShell,
} from "@/components/ui/data-table";
import {
  PayrollStatusBadge,
} from "@/components/payroll/payroll-status-badge";
import type { PayrollStatus } from "@/types/payroll";

type PayrollResult = {
  employeeId: string;
  name: string;
  grossPay: string;
  deductions: string;
  tax: string;
  netPay: string;
  status: PayrollStatus;
};

type PayrollResultsTableProps = {
  results: PayrollResult[];
};

export function PayrollResultsTable({ results }: PayrollResultsTableProps) {
  return (
    <>
      <DataTableShell className="hidden xl:block">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-slate-50/80">
              <tr className="text-left">
                <DataTableHeaderCell>Employee ID</DataTableHeaderCell>
                <DataTableHeaderCell>Name</DataTableHeaderCell>
                <DataTableHeaderCell>Gross Pay</DataTableHeaderCell>
                <DataTableHeaderCell>Deductions</DataTableHeaderCell>
                <DataTableHeaderCell>Tax</DataTableHeaderCell>
                <DataTableHeaderCell>Net Pay</DataTableHeaderCell>
                <DataTableHeaderCell>Status</DataTableHeaderCell>
              </tr>
            </thead>
            <tbody className="bg-white">
              {results.map((result) => (
                <tr key={result.employeeId}>
                  <DataTableBodyCell>{result.employeeId}</DataTableBodyCell>
                  <DataTableBodyCell>
                    <span className="font-medium text-slate-900">{result.name}</span>
                  </DataTableBodyCell>
                  <DataTableBodyCell>{result.grossPay}</DataTableBodyCell>
                  <DataTableBodyCell>{result.deductions}</DataTableBodyCell>
                  <DataTableBodyCell>{result.tax}</DataTableBodyCell>
                  <DataTableBodyCell>
                    <span className="font-semibold text-slate-900">
                      {result.netPay}
                    </span>
                  </DataTableBodyCell>
                  <DataTableBodyCell>
                    <PayrollStatusBadge status={result.status} />
                  </DataTableBodyCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataTableShell>

      <div className="grid gap-3 xl:hidden">
        {results.map((result) => (
          <article
            key={`${result.employeeId}-card`}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {result.employeeId}
                </p>
                <h3 className="mt-2 text-base font-semibold text-slate-950">
                  {result.name}
                </h3>
              </div>
              <PayrollStatusBadge status={result.status} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <DetailItem label="Gross Pay" value={result.grossPay} />
              <DetailItem label="Deductions" value={result.deductions} />
              <DetailItem label="Tax" value={result.tax} />
              <DetailItem label="Net Pay" value={result.netPay} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
