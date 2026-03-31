type PayrollHistoryItem = {
  period: string;
  runDate: string;
  grossPay: string;
  netPay: string;
  status: string;
};

type EmployeePayrollHistoryTableProps = {
  items: PayrollHistoryItem[];
};

export function EmployeePayrollHistoryTable({
  items,
}: EmployeePayrollHistoryTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="bg-slate-50/80">
            <tr className="text-left">
              <th className="border-b border-slate-200/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Period
              </th>
              <th className="border-b border-slate-200/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Run Date
              </th>
              <th className="border-b border-slate-200/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Gross Pay
              </th>
              <th className="border-b border-slate-200/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Net Pay
              </th>
              <th className="border-b border-slate-200/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {items.map((item) => (
              <tr key={`${item.period}-${item.runDate}`}>
                <td className="border-b border-slate-200/70 px-4 py-4 text-sm font-medium text-slate-900">
                  {item.period}
                </td>
                <td className="border-b border-slate-200/70 px-4 py-4 text-sm text-slate-600">
                  {item.runDate}
                </td>
                <td className="border-b border-slate-200/70 px-4 py-4 text-sm text-slate-600">
                  {item.grossPay}
                </td>
                <td className="border-b border-slate-200/70 px-4 py-4 text-sm text-slate-600">
                  {item.netPay}
                </td>
                <td className="border-b border-slate-200/70 px-4 py-4 text-sm text-slate-600">
                  {item.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

