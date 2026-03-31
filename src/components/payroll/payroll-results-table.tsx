import {
  PayrollStatusBadge,
  type PayrollStatus,
} from "@/components/payroll/payroll-status-badge";

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
      <div className="hidden ui-table-shell xl:block">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-slate-50/80">
              <tr className="text-left">
                <HeaderCell>Employee ID</HeaderCell>
                <HeaderCell>Name</HeaderCell>
                <HeaderCell>Gross Pay</HeaderCell>
                <HeaderCell>Deductions</HeaderCell>
                <HeaderCell>Tax</HeaderCell>
                <HeaderCell>Net Pay</HeaderCell>
                <HeaderCell>Status</HeaderCell>
              </tr>
            </thead>
            <tbody className="bg-white">
              {results.map((result) => (
                <tr key={result.employeeId}>
                  <BodyCell>{result.employeeId}</BodyCell>
                  <BodyCell>
                    <span className="font-medium text-slate-900">{result.name}</span>
                  </BodyCell>
                  <BodyCell>{result.grossPay}</BodyCell>
                  <BodyCell>{result.deductions}</BodyCell>
                  <BodyCell>{result.tax}</BodyCell>
                  <BodyCell>
                    <span className="font-semibold text-slate-900">
                      {result.netPay}
                    </span>
                  </BodyCell>
                  <BodyCell>
                    <PayrollStatusBadge status={result.status} />
                  </BodyCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
              <InfoItem label="Gross Pay" value={result.grossPay} />
              <InfoItem label="Deductions" value={result.deductions} />
              <InfoItem label="Tax" value={result.tax} />
              <InfoItem label="Net Pay" value={result.netPay} />
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
