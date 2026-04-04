"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, RefreshCw } from "lucide-react";
import {
  ResourceEmptyState,
  ResourceErrorState,
  ResourceTableSkeleton,
} from "@/components/shared/resource-state";
import { getPayslips } from "@/lib/api/payroll";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PayslipRecord } from "@/types/payroll";

export function PayslipWorkspace() {
  const [payslips, setPayslips] = useState<PayslipRecord[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadPayslips() {
    setLoading(true);
    setError(null);

    try {
      const records = await getPayslips();
      setPayslips(records);
      setSelectedId((currentValue) =>
        currentValue && records.some((item) => item.id === currentValue)
          ? currentValue
          : records[0]?.id ?? null,
      );
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load payslips.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPayslips();
  }, []);

  const selectedPayslip = useMemo(() => {
    return payslips.find((item) => item.id === selectedId) ?? payslips[0] ?? null;
  }, [payslips, selectedId]);

  if (loading) {
    return <ResourceTableSkeleton rowCount={6} />;
  }

  if (error) {
    return <ResourceErrorState title="Unable to load payslips" description={error} />;
  }

  if (!selectedPayslip) {
    return (
      <ResourceEmptyState
        title="No payslips found"
        description="Payslips appear here after payroll is calculated for a cutoff."
      />
    );
  }

  const totalNet = payslips.reduce((total, item) => total + Number(item.payroll_record.net_pay), 0);
  const systemComputedCount = payslips.filter(
    (item) => item.payroll_record.used_system_computed_attendance,
  ).length;
  const latestUpdatedAt = payslips[0]?.posted_at ?? payslips[0]?.updated_at ?? null;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Generated payslips" value={String(payslips.length)} detail="Payroll statements currently stored for finance review and release." />
        <Metric label="Total net pay" value={formatCurrency(totalNet)} detail="Combined net pay across the loaded payslip list." />
        <Metric label="System defaults" value={String(systemComputedCount)} detail="Payslips whose payroll used system-computed attendance." />
        <Metric label="Latest update" value={latestUpdatedAt ? formatDate(latestUpdatedAt) : "None"} detail="Most recent payslip calculation or posting update." />
      </section>

      <div className="panel p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Generated payslips</h2>
            <p className="mt-1 text-sm text-slate-600">Review payroll output by employee, including calculated, approved, and posted payslips.</p>
          </div>
          <button type="button" onClick={() => void loadPayslips()} className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-3">
            {payslips.map((item) => {
              const active = item.id === selectedPayslip.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "w-full rounded-2xl border px-4 py-4 text-left transition",
                    active
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200/80 bg-slate-50/70 hover:border-slate-300 hover:bg-white",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">
                        {item.payroll_record.employee_name_snapshot}
                      </p>
                      <p className={cn("mt-1 text-xs", active ? "text-slate-300" : "text-slate-500")}>
                        {item.generated_reference} • {formatDate(item.cutoff_start)} - {formatDate(item.cutoff_end)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-sm font-semibold", active ? "text-white" : "text-slate-900")}>
                        {formatCurrency(item.payroll_record.net_pay)}
                      </p>
                      <p className={cn("mt-1 text-[11px] font-semibold uppercase tracking-[0.16em]", active ? "text-slate-300" : payslipStatusToneClassName(item.status))}>
                        {pretty(item.status)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-950">
                  {selectedPayslip.payroll_record.employee_name_snapshot}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedPayslip.generated_reference}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Detail label="Cutoff" value={`${formatDate(selectedPayslip.cutoff_start)} - ${formatDate(selectedPayslip.cutoff_end)}`} />
              <Detail label="Payroll status" value={pretty(selectedPayslip.status)} />
              <Detail label="Posted at" value={selectedPayslip.posted_at ? formatDateTime(selectedPayslip.posted_at) : "Not posted yet"} />
              <Detail label="Gross pay" value={formatCurrency(selectedPayslip.payroll_record.gross_pay)} />
              <Detail label="Taxable income" value={formatCurrency(selectedPayslip.payroll_record.taxable_income)} />
              <Detail label="Gov't deductions" value={formatCurrency(selectedPayslip.payroll_record.government_deductions_total)} />
              <Detail label="Net pay" value={formatCurrency(selectedPayslip.payroll_record.net_pay)} />
              <Detail label="Total deductions" value={formatCurrency(selectedPayslip.payroll_record.total_deductions)} />
              <Detail label="Employer share" value={formatCurrency(selectedPayslip.payroll_record.total_employer_contributions)} />
              <Detail label="Source" value={pretty(selectedPayslip.payroll_record.calculation_source_status)} />
            </div>

            <div className="mt-5 space-y-3">
              {selectedPayslip.payroll_record.adjustments.length > 0 ? (
                selectedPayslip.payroll_record.adjustments.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{pretty(item.adjustment_type)}</p>
                        <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                      </div>
                      <span className={cn("text-sm font-semibold", item.category === "deduction" ? "text-rose-700" : "text-emerald-700")}>
                        {item.category === "deduction" ? "-" : "+"}
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <ResourceEmptyState
                  title="No breakdown rows"
                  description="No adjustment rows were stored for this payslip."
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-3xl border border-slate-200/80 bg-white px-5 py-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p><p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p><p className="mt-2 text-sm text-slate-600">{detail}</p></div>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p><p className="mt-2 text-sm font-medium text-slate-900">{value}</p></div>;
}

function pretty(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function payslipStatusToneClassName(status: string) {
  if (status === "posted") {
    return "text-emerald-700";
  }
  if (status === "approved") {
    return "text-sky-700";
  }
  return "text-amber-700";
}
