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

type PayslipItem = {
  employeeId: string;
  employeeName: string;
  period: string;
  releasedOn: string;
  netPay: string;
  status: PayrollStatus;
};

type RecentPayslipsTableProps = {
  items: PayslipItem[];
};

export function RecentPayslipsTable({ items }: RecentPayslipsTableProps) {
  return (
    <>
      <DataTableShell className="hidden xl:block">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-slate-50/80">
              <tr className="text-left">
                <DataTableHeaderCell>Employee ID</DataTableHeaderCell>
                <DataTableHeaderCell>Employee Name</DataTableHeaderCell>
                <DataTableHeaderCell>Period</DataTableHeaderCell>
                <DataTableHeaderCell>Released On</DataTableHeaderCell>
                <DataTableHeaderCell>Net Pay</DataTableHeaderCell>
                <DataTableHeaderCell>Status</DataTableHeaderCell>
              </tr>
            </thead>
            <tbody className="bg-white">
              {items.map((item) => (
                <tr key={`${item.employeeId}-${item.period}`}>
                  <DataTableBodyCell>{item.employeeId}</DataTableBodyCell>
                  <DataTableBodyCell>
                    <span className="font-medium text-slate-900">
                      {item.employeeName}
                    </span>
                  </DataTableBodyCell>
                  <DataTableBodyCell>{item.period}</DataTableBodyCell>
                  <DataTableBodyCell>{item.releasedOn}</DataTableBodyCell>
                  <DataTableBodyCell>
                    <span className="font-semibold text-slate-900">{item.netPay}</span>
                  </DataTableBodyCell>
                  <DataTableBodyCell>
                    <PayrollStatusBadge status={item.status} />
                  </DataTableBodyCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataTableShell>

      <div className="grid gap-3 xl:hidden">
        {items.map((item) => (
          <article
            key={`${item.employeeId}-${item.period}-card`}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {item.employeeId}
                </p>
                <h3 className="mt-2 text-base font-semibold text-slate-950">
                  {item.employeeName}
                </h3>
                <p className="mt-1 text-sm text-slate-600">{item.period}</p>
              </div>
              <PayrollStatusBadge status={item.status} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <DetailItem label="Released On" value={item.releasedOn} />
              <DetailItem label="Net Pay" value={item.netPay} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
