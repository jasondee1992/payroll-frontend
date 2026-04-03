"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { DetailItem } from "@/components/ui/detail-item";
import {
  DataTableBodyCell,
  DataTableHeaderCell,
  DataTableShell,
} from "@/components/ui/data-table";
import {
  PayrollStatusBadge,
} from "@/components/payroll/payroll-status-badge";
import type { PayrollPeriod } from "@/types/payroll";

type PayrollPeriodsTableProps = {
  periods: PayrollPeriod[];
};

export function PayrollPeriodsTable({ periods }: PayrollPeriodsTableProps) {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const selectedPeriod =
    periods.find((period) => period.id === selectedPeriodId) ?? null;

  return (
    <>
      <DataTableShell className="hidden xl:block">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-slate-50/80">
              <tr className="text-left">
                <DataTableHeaderCell>Period Name</DataTableHeaderCell>
                <DataTableHeaderCell>Start Date</DataTableHeaderCell>
                <DataTableHeaderCell>End Date</DataTableHeaderCell>
                <DataTableHeaderCell>Payout Date</DataTableHeaderCell>
                <DataTableHeaderCell>Status</DataTableHeaderCell>
                <DataTableHeaderCell>Actions</DataTableHeaderCell>
              </tr>
            </thead>
            <tbody className="bg-white">
              {periods.map((period) => (
                <tr key={period.id}>
                  <DataTableBodyCell>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {period.periodName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">ID: {period.id}</p>
                    </div>
                  </DataTableBodyCell>
                  <DataTableBodyCell>{period.startDate}</DataTableBodyCell>
                  <DataTableBodyCell>{period.endDate}</DataTableBodyCell>
                  <DataTableBodyCell>{period.payoutDate}</DataTableBodyCell>
                  <DataTableBodyCell>
                    <PayrollStatusBadge status={period.status} />
                  </DataTableBodyCell>
                  <DataTableBodyCell>
                    <button
                      type="button"
                      onClick={() => setSelectedPeriodId(period.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                  </DataTableBodyCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataTableShell>

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
              <DetailItem label="Start Date" value={period.startDate} />
              <DetailItem label="End Date" value={period.endDate} />
              <DetailItem label="Payout Date" value={period.payoutDate} />
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setSelectedPeriodId(period.id)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <Eye className="h-4 w-4" />
                View Period
              </button>
            </div>
          </article>
        ))}
      </div>

      {selectedPeriod ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="payroll-period-detail-title"
            className="w-full max-w-2xl rounded-[28px] border border-slate-200/80 bg-white shadow-2xl shadow-slate-950/20"
          >
            <div className="border-b border-slate-200/80 px-6 py-5">
              <h2
                id="payroll-period-detail-title"
                className="text-lg font-semibold text-slate-950"
              >
                Payroll Period Details
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Review the current backend-defined payroll cycle details.
              </p>
            </div>

            <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
              <DetailCard label="Period Name" value={selectedPeriod.periodName} />
              <DetailCard label="Period ID" value={selectedPeriod.id} />
              <DetailCard label="Start Date" value={selectedPeriod.startDate} />
              <DetailCard label="End Date" value={selectedPeriod.endDate} />
              <DetailCard label="Payout Date" value={selectedPeriod.payoutDate} />
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Status
                </p>
                <div className="mt-2">
                  <PayrollStatusBadge status={selectedPeriod.status} />
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200/80 px-6 py-5">
              <button
                type="button"
                onClick={() => setSelectedPeriodId(null)}
                className="ui-button-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
