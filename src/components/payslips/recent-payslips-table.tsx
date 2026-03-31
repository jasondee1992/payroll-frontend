import {
  PayrollStatusBadge,
  type PayrollStatus,
} from "@/components/payroll/payroll-status-badge";

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
      <div className="hidden ui-table-shell xl:block">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-slate-50/80">
              <tr className="text-left">
                <HeaderCell>Employee ID</HeaderCell>
                <HeaderCell>Employee Name</HeaderCell>
                <HeaderCell>Period</HeaderCell>
                <HeaderCell>Released On</HeaderCell>
                <HeaderCell>Net Pay</HeaderCell>
                <HeaderCell>Status</HeaderCell>
              </tr>
            </thead>
            <tbody className="bg-white">
              {items.map((item) => (
                <tr key={`${item.employeeId}-${item.period}`}>
                  <BodyCell>{item.employeeId}</BodyCell>
                  <BodyCell>
                    <span className="font-medium text-slate-900">
                      {item.employeeName}
                    </span>
                  </BodyCell>
                  <BodyCell>{item.period}</BodyCell>
                  <BodyCell>{item.releasedOn}</BodyCell>
                  <BodyCell>
                    <span className="font-semibold text-slate-900">{item.netPay}</span>
                  </BodyCell>
                  <BodyCell>
                    <PayrollStatusBadge status={item.status} />
                  </BodyCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
              <InfoItem label="Released On" value={item.releasedOn} />
              <InfoItem label="Net Pay" value={item.netPay} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return <th className="ui-table-head-cell">{children}</th>;
}

function BodyCell({ children }: { children: React.ReactNode }) {
  return <td className="ui-table-body-cell">{children}</td>;
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </span>
      <span className="text-sm text-slate-700">{value}</span>
    </div>
  );
}
