"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Calculator, CheckCircle2, RefreshCw, Send } from "lucide-react";
import { PayrollStatusBadge } from "@/components/payroll/payroll-status-badge";
import {
  ResourceEmptyState,
  ResourceErrorState,
  ResourceTableSkeleton,
} from "@/components/shared/resource-state";
import {
  approvePayrollBatch,
  calculatePayrollBatch,
  getPayrollBatchDetail,
  getPayrollBatches,
  getPayrollCutoffPreviews,
  normalizePayrollStatus,
  postPayrollBatch,
  recalculatePayrollBatch,
} from "@/lib/api/payroll";
import { canManagePayroll, type AppRole } from "@/lib/auth/session";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  PayrollBatchDetailRecord,
  PayrollBatchSummaryRecord,
  PayrollCutoffPreviewRecord,
  PayrollRecordRecord,
} from "@/types/payroll";

type Props = {
  role: AppRole | null;
};

const PAYROLL_REFRESH_INTERVAL_MS = 5000;

export function PayrollBatchWorkspace({ role }: Props) {
  const canManage = canManagePayroll(role);
  const batchListRef = useRef<HTMLDivElement | null>(null);
  const batchDetailRef = useRef<HTMLDivElement | null>(null);
  const [cutoffs, setCutoffs] = useState<PayrollCutoffPreviewRecord[]>([]);
  const [batches, setBatches] = useState<PayrollBatchSummaryRecord[]>([]);
  const [batch, setBatch] = useState<PayrollBatchDetailRecord | null>(null);
  const [cutoffId, setCutoffId] = useState<number | null>(null);
  const [batchId, setBatchId] = useState<number | null>(null);
  const [recordId, setRecordId] = useState<number | null>(null);
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadOverview = useCallback(async (
    preferredBatchId?: number | null,
    options?: { background?: boolean },
  ) => {
    const showLoader = !options?.background;

    if (showLoader) {
      setLoading(true);
    }
    setError(null);
    try {
      const [nextCutoffs, nextBatches] = await Promise.all([
        getPayrollCutoffPreviews(),
        getPayrollBatches(),
      ]);
      setCutoffs(nextCutoffs);
      setBatches(nextBatches);
      const nextCutoffId = cutoffId && nextCutoffs.some((item) => item.cutoff.id === cutoffId)
        ? cutoffId
        : nextCutoffs[0]?.cutoff.id ?? null;
      setCutoffId(nextCutoffId);
      const nextBatchId = preferredBatchId && nextBatches.some((item) => item.id === preferredBatchId)
        ? preferredBatchId
        : batchId && nextBatches.some((item) => item.id === batchId)
          ? batchId
          : nextCutoffs.find((item) => item.cutoff.id === nextCutoffId)?.existing_batch_id ??
            nextBatches[0]?.id ??
            null;
      setBatchId(nextBatchId);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load payroll data.");
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, [batchId, cutoffId]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    const refreshInBackground = () => {
      void loadOverview(batchId, { background: true });
    };

    const intervalId = window.setInterval(
      refreshInBackground,
      PAYROLL_REFRESH_INTERVAL_MS,
    );
    window.addEventListener("focus", refreshInBackground);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshInBackground);
    };
  }, [batchId, loadOverview]);

  useEffect(() => {
    if (batchId == null) {
      setBatch(null);
      setRecordId(null);
      return;
    }
    let cancelled = false;
    setLoadingBatch(true);
    setError(null);
    void getPayrollBatchDetail(batchId)
      .then((detail) => {
        if (cancelled) {
          return;
        }
        setBatch(detail);
        setRecordId((currentValue) =>
          currentValue && detail.records.some((record) => record.id === currentValue)
            ? currentValue
            : detail.records[0]?.id ?? null,
        );
        setRemarks(detail.remarks ?? "");
      })
      .catch((nextError) => {
        if (!cancelled) {
          setError(
            nextError instanceof Error ? nextError.message : "Unable to load payroll batch.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingBatch(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [batchId]);

  const selectedCutoff =
    cutoffs.find((item) => item.cutoff.id === cutoffId) ?? cutoffs[0] ?? null;
  const selectedRecord = useMemo(() => {
    if (!batch) {
      return null;
    }
    return batch.records.find((record) => record.id === recordId) ?? batch.records[0] ?? null;
  }, [batch, recordId]);
  const readyCutoffCount = useMemo(
    () => cutoffs.filter((item) => item.can_calculate && item.existing_batch_id == null).length,
    [cutoffs],
  );
  const selectedCutoffHasExistingBatch = selectedCutoff?.existing_batch_id != null;
  const selectedCutoffActionHint = selectedCutoffHasExistingBatch
    ? "A payroll batch already exists for this cutoff. Review it below or use Recalculate from the batch details."
    : selectedCutoff?.blocked_reason ?? null;

  function focusPayrollBatch(nextBatchId: number | null, nextCutoffId?: number | null) {
    setError(null);
    setMessage(null);
    if (nextCutoffId !== undefined) {
      setCutoffId(nextCutoffId);
    }
    setBatchId(nextBatchId);

    window.setTimeout(() => {
      const target = batchDetailRef.current ?? batchListRef.current;
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  async function runAction(action: "calculate" | "recalculate" | "approve" | "post") {
    const currentBatch = batch;
    const currentBatchId = currentBatch?.id ?? null;

    if (action === "calculate" && (!selectedCutoff || !canManage)) {
      return;
    }
    if (action !== "calculate" && (currentBatchId == null || !canManage)) {
      return;
    }
    const ensuredBatchId = currentBatchId ?? 0;
    if (action === "post" && !window.confirm("Post this payroll batch and release payslips?")) {
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const nextBatch =
        action === "calculate"
          ? await calculatePayrollBatch({ cutoffId: selectedCutoff.cutoff.id, remarks })
          : action === "recalculate"
            ? await recalculatePayrollBatch(ensuredBatchId, { remarks })
            : action === "approve"
              ? await approvePayrollBatch(ensuredBatchId, { remarks })
              : await postPayrollBatch(ensuredBatchId, { remarks });
      setBatch(nextBatch);
      setBatchId(nextBatch.id);
      setRecordId(nextBatch.records[0]?.id ?? null);
      setRemarks(nextBatch.remarks ?? remarks);
      setMessage(
        action === "calculate"
          ? `Payroll batch for ${label(nextBatch.cutoff.cutoff_start, nextBatch.cutoff.cutoff_end)} was calculated.`
          : action === "recalculate"
            ? `Payroll batch for ${label(nextBatch.cutoff.cutoff_start, nextBatch.cutoff.cutoff_end)} was recalculated.`
            : action === "approve"
              ? `Payroll batch for ${label(nextBatch.cutoff.cutoff_start, nextBatch.cutoff.cutoff_end)} was approved.`
              : `Payroll batch for ${label(nextBatch.cutoff.cutoff_start, nextBatch.cutoff.cutoff_end)} was posted.`
      );
      await loadOverview(nextBatch.id);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to update payroll batch.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <ResourceTableSkeleton rowCount={7} />;
  }

  if (error && cutoffs.length === 0 && batches.length === 0) {
    return <ResourceErrorState title="Unable to load payroll workflow" description={error} />;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card label="Ready cutoffs" value={String(readyCutoffCount)} detail="Attendance cutoffs that can move into payroll." />
        <Card label="Under review" value={String(batches.filter((item) => item.status === "under_finance_review").length)} detail="Batches waiting for finance review." />
        <Card label="Approved" value={String(batches.filter((item) => item.status === "approved").length)} detail="Approved batches waiting for posting." />
        <Card label="Posted" value={String(batches.filter((item) => item.status === "posted").length)} detail="Posted payroll with released payslips." />
      </section>

      {error ? <Banner tone="error">{error}</Banner> : null}
      {message ? <Banner tone="success">{message}</Banner> : null}

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="panel p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Cutoff readiness</h2>
              <p className="mt-1 text-sm text-slate-600">Payroll can proceed after the review window closes, even with no employee response.</p>
            </div>
            <button type="button" onClick={() => void loadOverview(batchId)} className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {cutoffs.length > 0 ? cutoffs.map((item) => {
              const active = item.cutoff.id === selectedCutoff?.cutoff.id;
              return (
                <button
                  key={item.cutoff.id}
                  type="button"
                  onClick={() => {
                    setCutoffId(item.cutoff.id);
                    setBatchId(item.existing_batch_id ?? null);
                  }}
                  className={cn("w-full rounded-2xl border px-4 py-4 text-left transition", active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200/80 bg-slate-50/70 hover:border-slate-300 hover:bg-white")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{label(item.cutoff.cutoff_start, item.cutoff.cutoff_end)}</p>
                      <p className={cn("mt-1 text-xs", active ? "text-slate-300" : "text-slate-500")}>
                        Review deadline {item.review_deadline_at ? formatDateTime(item.review_deadline_at) : "Not set"}
                      </p>
                    </div>
                    <PayrollStatusBadge status={normalizePayrollStatus(item.existing_batch_status ?? item.cutoff.status)} />
                  </div>
                </button>
              );
            }) : <ResourceEmptyState title="No attendance cutoffs found" description="Upload and review attendance to generate a payroll-ready cutoff." />}
          </div>

          {selectedCutoff && canManage ? (
            <div className="mt-5 space-y-3">
              {selectedCutoffActionHint ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {selectedCutoffActionHint}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={submitting || !selectedCutoff.can_calculate || selectedCutoffHasExistingBatch}
                  onClick={() => void runAction("calculate")}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <Calculator className="h-4 w-4" />
                  Calculate payroll
                </button>
                {selectedCutoffHasExistingBatch ? (
                  <button
                    type="button"
                    onClick={() => {
                      focusPayrollBatch(
                        selectedCutoff.existing_batch_id ?? null,
                        selectedCutoff.cutoff.id,
                      );
                      setMessage(
                        `Opened the payroll batch for ${label(selectedCutoff.cutoff.cutoff_start, selectedCutoff.cutoff.cutoff_end)} below.`,
                      );
                    }}
                    className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Open payroll batch
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <div ref={batchListRef} className="panel p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-950">Payroll batches</h2>
          <p className="mt-1 text-sm text-slate-600">Review computed payroll before approval and posting.</p>
          <div className="mt-5 space-y-3">
            {batches.length > 0 ? batches.map((item) => {
              const active = item.id === batchId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    focusPayrollBatch(item.id, item.cutoff.id);
                  }}
                  className={cn("w-full rounded-2xl border px-4 py-4 text-left transition", active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200/80 bg-slate-50/70 hover:border-slate-300 hover:bg-white")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{label(item.cutoff.cutoff_start, item.cutoff.cutoff_end)}</p>
                      <p className={cn("mt-1 text-xs", active ? "text-slate-300" : "text-slate-500")}>
                        {item.record_count} employees • {item.records_with_flags} flagged
                      </p>
                    </div>
                    <PayrollStatusBadge status={normalizePayrollStatus(item.status)} />
                  </div>
                  <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                    <Mini label="Gross" value={formatCurrency(item.total_gross_pay)} active={active} />
                    <Mini label="Deductions" value={formatCurrency(item.total_deductions)} active={active} />
                    <Mini label="Net" value={formatCurrency(item.total_net_pay)} active={active} />
                  </div>
                </button>
              );
            }) : <ResourceEmptyState title="No payroll batches yet" description="Calculated payroll batches will appear here for finance review." />}
          </div>
        </div>
      </section>

      <div ref={batchDetailRef} className="panel p-5 sm:p-6">
        {loadingBatch ? <ResourceTableSkeleton rowCount={5} /> : !batch ? (
          <ResourceEmptyState title="Select a payroll batch" description="Choose a batch to inspect the employee-level payroll breakdown." />
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold text-slate-950">{label(batch.cutoff.cutoff_start, batch.cutoff.cutoff_end)}</h2>
                  <PayrollStatusBadge status={normalizePayrollStatus(batch.status)} />
                </div>
                <p className="mt-2 text-sm text-slate-600">{batch.records_using_system_defaults} records used system-computed attendance defaults.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {canManage && batch.status !== "posted" && batch.status !== "locked" ? <Action icon={RefreshCw} label="Recalculate" disabled={submitting} onClick={() => void runAction("recalculate")} /> : null}
                {canManage && batch.status === "under_finance_review" ? <Action icon={CheckCircle2} label="Approve" disabled={submitting} onClick={() => void runAction("approve")} /> : null}
                {canManage && batch.status === "approved" ? <Action icon={Send} label="Post payroll" disabled={submitting} onClick={() => void runAction("post")} /> : null}
              </div>
            </div>

            <textarea
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              rows={3}
              disabled={!canManage || submitting}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              placeholder="Finance remarks"
            />

            <div className="overflow-hidden rounded-2xl border border-slate-200/80">
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0">
                  <thead className="bg-slate-50/80">
                    <tr className="text-left">
                      <Head>Employee</Head>
                      <Head>Source</Head>
                      <Head>Flags</Head>
                      <Head>Gross</Head>
                      <Head>Deductions</Head>
                      <Head>Net</Head>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {batch.records.map((item) => (
                      <tr key={item.id} className={cn("cursor-pointer transition hover:bg-slate-50", item.id === selectedRecord?.id && "bg-slate-50")} onClick={() => setRecordId(item.id)}>
                        <Cell>
                          <div>
                            <p className="font-medium text-slate-900">{item.employee_name_snapshot}</p>
                            <p className="mt-1 text-xs text-slate-500">{item.employee_code_snapshot}</p>
                          </div>
                        </Cell>
                        <Cell>{pretty(item.calculation_source_status)}</Cell>
                        <Cell>{flags(item).length > 0 ? flags(item).join(", ") : "Clear"}</Cell>
                        <Cell>{formatCurrency(item.gross_pay)}</Cell>
                        <Cell>{formatCurrency(item.total_deductions)}</Cell>
                        <Cell><span className="font-semibold text-slate-900">{formatCurrency(item.net_pay)}</span></Cell>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedRecord ? (
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
                  <h3 className="text-lg font-semibold text-slate-950">{selectedRecord.employee_name_snapshot}</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Detail label="Basic pay" value={formatCurrency(selectedRecord.basic_pay)} />
                    <Detail label="Overtime pay" value={formatCurrency(selectedRecord.overtime_pay)} />
                    <Detail label="Night differential" value={formatCurrency(selectedRecord.night_differential_pay)} />
                    <Detail label="Leave pay" value={formatCurrency(selectedRecord.leave_pay)} />
                    <Detail label="Late deduction" value={formatCurrency(selectedRecord.late_deduction)} />
                    <Detail label="Undertime deduction" value={formatCurrency(selectedRecord.undertime_deduction)} />
                    <Detail label="Absence deduction" value={formatCurrency(selectedRecord.absence_deduction)} />
                    <Detail label="Net pay" value={formatCurrency(selectedRecord.net_pay)} />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
                  <h3 className="text-lg font-semibold text-slate-950">Audit detail</h3>
                  <div className="mt-4 grid gap-3">
                    <Detail label="Attendance review" value={pretty(selectedRecord.attendance_review_status)} />
                    <Detail label="Acknowledged at" value={selectedRecord.attendance_acknowledged_at ? formatDateTime(selectedRecord.attendance_acknowledged_at) : "No acknowledgement"} />
                    <Detail label="Approved requests" value={String(selectedRecord.approved_request_count)} />
                    <Detail label="Unresolved requests" value={String(selectedRecord.unresolved_request_count)} />
                    <Detail label="Flags" value={flags(selectedRecord).length > 0 ? flags(selectedRecord).join(", ") : "Clear"} />
                  </div>
                  <div className="mt-4 space-y-3">
                    {selectedRecord.adjustments.length > 0 ? selectedRecord.adjustments.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">{pretty(item.adjustment_type)}</p>
                            <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                          </div>
                          <span className={cn("text-sm font-semibold", item.category === "deduction" ? "text-rose-700" : "text-emerald-700")}>
                            {item.category === "deduction" ? "-" : "+"}{formatCurrency(item.amount)}
                          </span>
                        </div>
                      </div>
                    )) : <ResourceEmptyState title="No stored adjustments" description="This record does not have extra positive adjustment rows." />}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-3xl border border-slate-200/80 bg-white px-5 py-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p><p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p><p className="mt-2 text-sm text-slate-600">{detail}</p></div>;
}

function Banner({ children, tone }: { children: React.ReactNode; tone: "error" | "success" }) {
  return <div className={cn("rounded-2xl px-4 py-4 text-sm", tone === "error" ? "border border-rose-200 bg-rose-50 text-rose-800" : "border border-emerald-200 bg-emerald-50 text-emerald-800")}>{children}</div>;
}

function Action({ icon: Icon, label, onClick, disabled }: { icon: typeof RefreshCw; label: string; onClick: () => void; disabled: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"><Icon className="h-4 w-4" />{label}</button>;
}

function Head({ children }: { children: React.ReactNode }) {
  return <th className="border-b border-slate-200/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{children}</th>;
}

function Cell({ children }: { children: React.ReactNode }) {
  return <td className="border-b border-slate-200/70 px-4 py-4 text-sm text-slate-600">{children}</td>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p><p className="mt-2 text-sm font-medium text-slate-900">{value}</p></div>;
}

function Mini({ label, value, active }: { label: string; value: string; active: boolean }) {
  return <div><p className={cn("text-[11px] font-semibold uppercase tracking-[0.16em]", active ? "text-slate-300" : "text-slate-500")}>{label}</p><p className={cn("mt-1", active ? "text-white" : "text-slate-900")}>{value}</p></div>;
}

function label(start: string, end: string) {
  return `${formatDate(start)} to ${formatDate(end)}`;
}

function pretty(value: string) {
  return value.replaceAll("-", " ").replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function flags(record: PayrollRecordRecord) {
  return [
    record.no_employee_response ? "No response" : null,
    record.used_system_computed_attendance ? "System computed" : null,
    record.has_missing_attendance_issues ? "Missing logs" : null,
    record.has_unresolved_requests ? "Pending request" : null,
    record.has_unusual_adjustments ? "Needs review" : null,
  ].filter((item): item is string => item != null);
}
