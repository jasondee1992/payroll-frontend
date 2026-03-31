import { Eye } from "lucide-react";
import {
  PayrollStatusBadge,
  type PayrollStatus,
} from "@/components/payroll/payroll-status-badge";

type PayrollPeriod = {
  id: string;
  periodName: string;
  startDate: string;
  endDate: string;
  payoutDate: string;
  status: PayrollStatus;
};

type PayrollPeriodsTableProps = {
  periods: PayrollPeriod[];
};

export function PayrollPeriodsTable({ periods }: PayrollPeriodsTableProps) {
  return (
    <>
      <div className="hidden ui-table-shell xl:block">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-slate-50/80">
              <tr className="text-left">
                <HeaderCell>Period Name</HeaderCell>
                <HeaderCell>Start Date</HeaderCell>
                <HeaderCell>End Date</HeaderCell>
                <HeaderCell>Payout Date</HeaderCell>
                <HeaderCell>Status</HeaderCell>
                <HeaderCell>Actions</HeaderCell>
              </tr>
            </thead>
            <tbody className="bg-white">
              {periods.map((period) => (
                <tr key={period.id}>
                  <BodyCell>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {period.periodName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">ID: {period.id}</p>
                    </div>
                  </BodyCell>
                  <BodyCell>{period.startDate}</BodyCell>
                  <BodyCell>{period.endDate}</BodyCell>
                  <BodyCell>{period.payoutDate}</BodyCell>
                  <BodyCell>
                    <PayrollStatusBadge status={period.status} />
                  </BodyCell>
                  <BodyCell>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                  </BodyCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 xl:hidden">
        {periods.map((period) => (
          <article
            key={`${period.id}-card`}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-950">
                  {period.periodName}
                </p>
                <p className="mt-1 text-sm text-slate-500">ID: {period.id}</p>
              </div>
              <PayrollStatusBadge status={period.status} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InfoItem label="Start Date" value={period.startDate} />
              <InfoItem label="End Date" value={period.endDate} />
              <InfoItem label="Payout Date" value={period.payoutDate} />
            </div>

            <div className="mt-4">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <Eye className="h-4 w-4" />
                View Period
              </button>
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
