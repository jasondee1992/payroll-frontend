"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lock,
  LockOpen,
  RefreshCw,
  Send,
  Trash2,
} from "lucide-react";
import { PayrollStatusBadge } from "@/components/payroll/payroll-status-badge";
import {
  ResourceEmptyState,
  ResourceErrorState,
  ResourceTableSkeleton,
} from "@/components/shared/resource-state";
import {
  approvePayrollBatch,
  calculateEmployeePayrollCutoff,
  calculatePayrollBatch,
  discardPayrollBatch,
  evaluateEmployeePayrollCutoffStatuses,
  getEmployeePayrollCutoffPreview,
  getEmployeePayrollCutoffStatuses,
  getPayrollBatchDetail,
  getPayrollBatches,
  getPayrollCutoffPreviews,
  lockEmployeePayrollCutoff,
  normalizePayrollStatus,
  postPayrollBatch,
  recalculateEmployeePayrollCutoff,
  recalculatePayrollBatch,
  recalculatePayrollRecord,
  unlockEmployeePayrollCutoff,
} from "@/lib/api/payroll";
import { canManagePayroll, type AppRole } from "@/lib/auth/session";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  EmployeePayrollCutoffPreviewRecord,
  EmployeePayrollCutoffStatusRecord,
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
  const [cutoffEmployeeStatuses, setCutoffEmployeeStatuses] = useState<
    EmployeePayrollCutoffStatusRecord[]
  >([]);
  const [batches, setBatches] = useState<PayrollBatchSummaryRecord[]>([]);
  const [batch, setBatch] = useState<PayrollBatchDetailRecord | null>(null);
  const [cutoffId, setCutoffId] = useState<number | null>(null);
  const [batchId, setBatchId] = useState<number | null>(null);
  const [expandedRecordIds, setExpandedRecordIds] = useState<number[]>([]);
  const [recordReviewRemarks, setRecordReviewRemarks] = useState<Record<number, string>>({});
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState<
    "all" | "not_ready" | "ready_to_lock" | "locked" | "calculated" | "finalized" | "issues"
  >("all");
  const [employeePreview, setEmployeePreview] =
    useState<EmployeePayrollCutoffPreviewRecord | null>(null);
  const [employeePreviewStatus, setEmployeePreviewStatus] =
    useState<EmployeePayrollCutoffStatusRecord | null>(null);
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [loadingCutoffEmployees, setLoadingCutoffEmployees] = useState(false);
  const [loadingEmployeePreview, setLoadingEmployeePreview] = useState(false);
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

  const loadCutoffEmployees = useCallback(async (
    nextCutoffId: number | null,
    options?: { background?: boolean; forceEvaluate?: boolean },
  ) => {
    if (nextCutoffId == null) {
      setCutoffEmployeeStatuses([]);
      setEmployeePreview(null);
      setEmployeePreviewStatus(null);
      return;
    }

    const showLoader = !options?.background;
    if (showLoader) {
      setLoadingCutoffEmployees(true);
    }

    try {
      const nextStatuses = options?.forceEvaluate
        ? await evaluateEmployeePayrollCutoffStatuses(nextCutoffId)
        : await getEmployeePayrollCutoffStatuses(nextCutoffId);
      setCutoffEmployeeStatuses(nextStatuses);
      setEmployeePreviewStatus((currentValue) =>
        currentValue == null
          ? null
          : nextStatuses.find((item) => item.employee_id === currentValue.employee_id) ?? null,
      );
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to load employee payroll cutoff statuses.",
      );
    } finally {
      if (showLoader) {
        setLoadingCutoffEmployees(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    void loadCutoffEmployees(cutoffId);
  }, [cutoffId, loadCutoffEmployees]);

  useEffect(() => {
    setEmployeePreview(null);
    setEmployeePreviewStatus(null);
  }, [cutoffId]);

  useEffect(() => {
    const refreshInBackground = () => {
      void loadOverview(batchId, { background: true });
      void loadCutoffEmployees(cutoffId, { background: true });
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
  }, [batchId, cutoffId, loadCutoffEmployees, loadOverview]);

  useEffect(() => {
    if (batchId == null) {
      setBatch(null);
      setRecordReviewRemarks({});
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
        setExpandedRecordIds((currentValue) =>
          currentValue.filter((value) => detail.records.some((record) => record.id === value)),
        );
        setRecordReviewRemarks(
          detail.records.reduce<Record<number, string>>((accumulator, record) => {
            accumulator[record.id] = record.review_remarks ?? "";
            return accumulator;
          }, {}),
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
  const readyCutoffCount = useMemo(
    () => cutoffs.filter((item) => item.can_calculate && item.existing_batch_id == null).length,
    [cutoffs],
  );
  const filteredCutoffEmployeeStatuses = useMemo(
    () =>
      cutoffEmployeeStatuses.filter((item) => {
        if (employeeStatusFilter === "all") {
          return true;
        }
        if (employeeStatusFilter === "issues") {
          return item.blocking_issues.length > 0 || item.warnings.length > 0;
        }
        return item.readiness_status === employeeStatusFilter;
      }),
    [cutoffEmployeeStatuses, employeeStatusFilter],
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

  function toggleRecordExpansion(recordIdValue: number) {
    setExpandedRecordIds((currentValue) =>
      currentValue.includes(recordIdValue)
        ? currentValue.filter((value) => value !== recordIdValue)
        : [...currentValue, recordIdValue],
    );
  }

  async function runRecordRecalculation(record: PayrollRecordRecord) {
    if (!canManage || batch == null) {
      return;
    }

    const reviewRemarks = recordReviewRemarks[record.id] ?? "";
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const nextBatch = await recalculatePayrollRecord(record.id, {
        remarks,
        reviewRemarks,
      });
      setBatch(nextBatch);
      setBatchId(nextBatch.id);
      setExpandedRecordIds((currentValue) =>
        currentValue.includes(record.id) ? currentValue : [...currentValue, record.id],
      );
      setRecordReviewRemarks(
        nextBatch.records.reduce<Record<number, string>>((accumulator, batchRecord) => {
          accumulator[batchRecord.id] = batchRecord.review_remarks ?? "";
          return accumulator;
        }, {}),
      );
      setRemarks(nextBatch.remarks ?? remarks);
      setMessage(`Payroll for ${record.employee_name_snapshot} was recalculated.`);
      await loadOverview(nextBatch.id);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to recalculate the selected payroll record.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function loadEmployeePreview(statusRecord: EmployeePayrollCutoffStatusRecord) {
    const alreadyOpen = employeePreviewStatus?.employee_id === statusRecord.employee_id;

    if (alreadyOpen) {
      setEmployeePreviewStatus(null);
      setEmployeePreview(null);
      setLoadingEmployeePreview(false);
      return;
    }

    setEmployeePreviewStatus(statusRecord);
    setEmployeePreview(null);

    if (!statusRecord.is_calculated || !statusRecord.preview_available) {
      return;
    }

    setLoadingEmployeePreview(true);
    setError(null);
    try {
      const nextPreview = await getEmployeePayrollCutoffPreview(
        statusRecord.cutoff_id,
        statusRecord.employee_id,
      );
      setEmployeePreview(nextPreview);
      setEmployeePreviewStatus(statusRecord);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to load the employee payroll preview.",
      );
    } finally {
      setLoadingEmployeePreview(false);
    }
  }

  async function runEmployeeCutoffAction(
    action: "evaluate" | "lock" | "unlock" | "calculate" | "recalculate" | "review",
    statusRecord?: EmployeePayrollCutoffStatusRecord,
  ) {
    const activeCutoffId = selectedCutoff?.cutoff.id ?? null;
    if (!canManage && action !== "review") {
      return;
    }
    if (action !== "evaluate" && !statusRecord) {
      return;
    }
    if (action === "review" && statusRecord) {
      await loadEmployeePreview(statusRecord);
      return;
    }
    if (activeCutoffId == null) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      let preferredBatchId = batchId;
      if (action === "evaluate") {
        const nextStatuses = await evaluateEmployeePayrollCutoffStatuses(activeCutoffId);
        setCutoffEmployeeStatuses(nextStatuses);
        setMessage("Employee payroll readiness was re-evaluated for this cutoff.");
        await loadOverview(preferredBatchId, { background: true });
        return;
      }

      if (statusRecord == null) {
        return;
      }

      if (action === "lock") {
        await lockEmployeePayrollCutoff(statusRecord.cutoff_id, statusRecord.employee_id);
        setMessage(`Locked ${statusRecord.employee_name} for payroll.`);
      } else if (action === "unlock") {
        await unlockEmployeePayrollCutoff(statusRecord.cutoff_id, statusRecord.employee_id);
        setMessage(`Unlocked ${statusRecord.employee_name} from payroll.`);
      } else {
        const nextBatch =
          action === "calculate"
            ? await calculateEmployeePayrollCutoff(statusRecord.cutoff_id, statusRecord.employee_id, {
                remarks,
              })
            : await recalculateEmployeePayrollCutoff(
                statusRecord.cutoff_id,
                statusRecord.employee_id,
                {
                  remarks,
                },
              );
        setBatch(nextBatch);
        setBatchId(nextBatch.id);
        setRemarks(nextBatch.remarks ?? remarks);
        preferredBatchId = nextBatch.id;
        setMessage(
          action === "calculate"
            ? `Calculated payroll for ${statusRecord.employee_name}.`
            : `Recalculated payroll for ${statusRecord.employee_name}.`,
        );
      }

      await loadOverview(preferredBatchId, { background: true });
      await loadCutoffEmployees(activeCutoffId, { background: true });
      if (statusRecord.preview_available || action === "calculate" || action === "recalculate") {
        const refreshedStatuses =
          action === "calculate" || action === "recalculate"
            ? await getEmployeePayrollCutoffStatuses(activeCutoffId)
            : null;
        if (refreshedStatuses != null) {
          setCutoffEmployeeStatuses(refreshedStatuses);
          const refreshedStatus = refreshedStatuses.find(
            (item) => item.employee_id === statusRecord.employee_id,
          );
          if (refreshedStatus) {
            await loadEmployeePreview(refreshedStatus);
          }
        }
      }
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to update the employee payroll cutoff status.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function runAction(action: "calculate" | "recalculate" | "approve" | "post" | "discard") {
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
    if (
      action === "discard" &&
      !window.confirm(
        "Discard this unposted payroll batch? This will remove the computed batch, employee records, and any unposted payslip rows for this cutoff.",
      )
    ) {
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      if (action === "discard") {
        const discardedBatch = currentBatch;
        await discardPayrollBatch(ensuredBatchId);
        setBatch(null);
        setBatchId(null);
        setExpandedRecordIds([]);
        setRecordReviewRemarks({});
        setRemarks("");
        if (discardedBatch != null) {
          setCutoffId(discardedBatch.cutoff.id);
          setMessage(
            `Payroll batch for ${label(discardedBatch.cutoff.cutoff_start, discardedBatch.cutoff.cutoff_end)} was discarded.`,
          );
          await loadOverview(null);
        } else {
          await loadOverview(null);
        }
      } else {
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
      }
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
              <p className="mt-1 text-sm text-slate-600">Select a cutoff, review the employee readiness rows below, and calculate batch payroll from the locked employees.</p>
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

      <section className="panel p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Cutoff employee payroll control</h2>
            <p className="mt-1 text-sm text-slate-600">
              Review readiness per employee, lock eligible rows, then calculate payroll without waiting for the whole cutoff.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadCutoffEmployees(cutoffId)}
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            {canManage ? (
              <button
                type="button"
                disabled={submitting || cutoffId == null}
                onClick={() => void runEmployeeCutoffAction("evaluate")}
                className="inline-flex h-10 items-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <CheckCircle2 className="h-4 w-4" />
                Re-evaluate
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {([
            ["all", "All"],
            ["not_ready", "Not ready"],
            ["ready_to_lock", "Ready to lock"],
            ["locked", "Locked"],
            ["calculated", "Calculated"],
            ["finalized", "Finalized"],
            ["issues", "Issues / pending"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setEmployeeStatusFilter(value)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition",
                employeeStatusFilter === value
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200/80">
          {loadingCutoffEmployees ? (
            <ResourceTableSkeleton rowCount={6} />
          ) : filteredCutoffEmployeeStatuses.length === 0 ? (
            <div className="p-6">
              <ResourceEmptyState
                title="No employee payroll rows for this cutoff"
                description="Upload attendance for the cutoff to populate employee payroll readiness rows."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead className="bg-slate-50/80">
                  <tr className="text-left">
                    <Head>Review</Head>
                    <Head>Employee</Head>
                    <Head>Attendance</Head>
                    <Head>Leave</Head>
                    <Head>Overtime</Head>
                    <Head>Readiness</Head>
                    <Head>Locked</Head>
                    <Head>Calculated</Head>
                    <Head>Finalized</Head>
                    <Head>Actions</Head>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredCutoffEmployeeStatuses.map((item) => {
                    const previewOpen = employeePreviewStatus?.employee_id === item.employee_id;
                    const calculateDisabled = !item.is_locked || item.is_finalized;
                    const showIssues = item.blocking_issues[0] ?? item.warnings[0] ?? item.notes ?? "Clear";

                    return (
                      <Fragment key={item.id}>
                        <tr className="transition hover:bg-slate-50">
                          <Cell>
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => void runEmployeeCutoffAction("review", item)}
                              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                            >
                              {previewOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              {previewOpen ? "Collapse" : "Expand"}
                            </button>
                          </Cell>
                          <Cell>
                            <div>
                              <p className="font-medium text-slate-900">{item.employee_name}</p>
                              <p className="mt-1 text-xs text-slate-500">{item.employee_code}</p>
                              <p className="mt-2 text-xs text-slate-500">{showIssues}</p>
                            </div>
                          </Cell>
                          <Cell>
                            <StatusPill
                              label={item.attendance_validated ? "Validated" : item.attendance_uploaded ? "For review" : "Missing"}
                              tone={item.attendance_validated ? "success" : item.attendance_uploaded ? "warning" : "danger"}
                            />
                          </Cell>
                          <Cell><InlineStatusBadge value={item.leave_status} /></Cell>
                          <Cell><InlineStatusBadge value={item.overtime_status} /></Cell>
                          <Cell><ReadinessBadge status={item.readiness_status} /></Cell>
                          <Cell>{item.is_locked ? <FlagMark label="Locked" tone="success" /> : <FlagMark label="Open" tone="neutral" />}</Cell>
                          <Cell>{item.is_calculated ? <FlagMark label="Calculated" tone="success" /> : <FlagMark label="Pending" tone="warning" />}</Cell>
                          <Cell>{item.is_finalized ? <FlagMark label="Finalized" tone="success" /> : <FlagMark label="Not final" tone="neutral" />}</Cell>
                          <Cell>
                            <div className="flex flex-wrap gap-2">
                              {canManage ? (
                                item.is_locked ? (
                                  <button
                                    type="button"
                                    disabled={submitting || item.is_finalized}
                                    onClick={() => void runEmployeeCutoffAction("unlock", item)}
                                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                                  >
                                    <LockOpen className="h-3.5 w-3.5" />
                                    Unlock
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={submitting || item.readiness_status !== "ready_to_lock"}
                                    onClick={() => void runEmployeeCutoffAction("lock", item)}
                                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                                  >
                                    <Lock className="h-3.5 w-3.5" />
                                    Lock for payroll
                                  </button>
                                )
                              ) : null}
                              {canManage ? (
                                item.is_calculated ? (
                                  <button
                                    type="button"
                                    disabled={submitting || calculateDisabled}
                                    onClick={() => void runEmployeeCutoffAction("recalculate", item)}
                                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 text-xs font-semibold text-sky-800 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                                  >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    Recalculate
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={submitting || calculateDisabled}
                                    onClick={() => void runEmployeeCutoffAction("calculate", item)}
                                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-300 disabled:text-white"
                                  >
                                    <Calculator className="h-3.5 w-3.5" />
                                    Calculate
                                  </button>
                                )
                              ) : null}
                            </div>
                          </Cell>
                        </tr>
                        {previewOpen ? (
                          <tr className="bg-slate-50/60">
                            <td colSpan={10} className="border-b border-slate-200/70 px-4 py-5">
                              {loadingEmployeePreview ? (
                                <ResourceTableSkeleton rowCount={3} />
                              ) : item.is_calculated && employeePreview ? (
                                <div className="space-y-4">
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-semibold text-slate-950">
                                        {item.employee_name}
                                      </p>
                                      <p className="mt-1 text-xs text-slate-500">
                                        Saved payroll result for this employee and cutoff.
                                      </p>
                                    </div>
                                    <ReadinessBadge status={item.readiness_status} />
                                  </div>
                                  <EmployeeCutoffStatusNotes statusRecord={item} />
                                  <ExpandedPayrollRecord
                                    record={employeePreview.record}
                                    canRecalculate={false}
                                    submitting={submitting}
                                    reviewRemarks={employeePreview.record.review_remarks ?? ""}
                                    onReviewRemarksChange={() => undefined}
                                    onRecalculate={() => undefined}
                                  />
                                </div>
                              ) : (
                                <EmployeeCutoffPreviewEmptyState statusRecord={item} />
                              )}
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
                {canManage && batch.status !== "posted" && batch.status !== "locked" ? <Action icon={Trash2} label="Discard batch" disabled={submitting} tone="danger" onClick={() => void runAction("discard")} /> : null}
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
                      <Head>Review</Head>
                      <Head>Employee</Head>
                      <Head>Source</Head>
                      <Head>Flags</Head>
                      <Head>Gross</Head>
                      <Head>Deductions</Head>
                      <Head>Net</Head>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {batch.records.map((item) => {
                      const expanded = expandedRecordIds.includes(item.id);
                      const canRecalculateRecord =
                        canManage && batch.status !== "posted" && batch.status !== "locked";

                      return (
                        <Fragment key={item.id}>
                          <tr
                            className="transition hover:bg-slate-50"
                          >
                            <Cell>
                              <div className="flex flex-col items-start gap-2">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    toggleRecordExpansion(item.id);
                                  }}
                                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                  {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                  {expanded ? "Hide" : "Expand"}
                                </button>
                              </div>
                            </Cell>
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
                            <Cell><span className={cn("font-semibold", Number(item.net_pay) < 0 ? "text-rose-700" : "text-slate-900")}>{formatCurrency(item.net_pay)}</span></Cell>
                          </tr>
                          {expanded ? (
                            <tr className="bg-slate-50/60">
                              <td colSpan={7} className="border-b border-slate-200/70 px-4 py-5">
                                <ExpandedPayrollRecord
                                  record={item}
                                  canRecalculate={canRecalculateRecord}
                                  submitting={submitting}
                                  reviewRemarks={recordReviewRemarks[item.id] ?? ""}
                                  onReviewRemarksChange={(value) =>
                                    setRecordReviewRemarks((currentValue) => ({
                                      ...currentValue,
                                      [item.id]: value,
                                    }))
                                  }
                                  onRecalculate={() => void runRecordRecalculation(item)}
                                />
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

function ExpandedPayrollRecord({
  record,
  canRecalculate,
  submitting,
  reviewRemarks,
  onReviewRemarksChange,
  onRecalculate,
}: {
  record: PayrollRecordRecord;
  canRecalculate: boolean;
  submitting: boolean;
  reviewRemarks: string;
  onReviewRemarksChange: (value: string) => void;
  onRecalculate: () => void;
}) {
  const coreEarningTypes = new Set([
    "basic_pay",
    "leave_pay",
    "overtime_pay",
    "night_differential_pay",
  ]);
  const deductionBreakdowns = record.deduction_breakdowns.map((item) => ({
    ...item,
    snapshot: parseBreakdownSnapshot(item.config_snapshot_json),
  }));
  const loanRows = deductionBreakdowns
    .filter((item) => isEmployeeLoanBreakdown(item.snapshot))
    .map((item) => ({
      label: item.deduction_name,
      amount: item.employee_share,
      note:
        typeof item.snapshot?.installment_number === "number"
          ? `Employee loan installment #${item.snapshot.installment_number}.`
          : "Employee loan deduction for this cutoff.",
    }));
  const loanDeductionTotal = sumAmountStrings(loanRows.map((item) => item.amount));
  const residualOtherDeductions = subtractAmountStrings(
    record.other_deductions,
    loanDeductionTotal,
  );
  const earningRows = [
    {
      label: "Basic pay",
      amount: record.basic_pay,
      note: "Base pay for the selected cutoff period.",
    },
    {
      label: "Leave pay",
      amount: record.leave_pay,
      note: "Added only from approved paid leave requests.",
    },
    {
      label: "Overtime pay",
      amount: record.overtime_pay,
      note: `${record.total_overtime_minutes} approved overtime minutes were included.`,
    },
    {
      label: "Night differential",
      amount: record.night_differential_pay,
      note: `${record.total_night_differential_minutes} night differential minutes were included.`,
    },
    ...record.adjustments
      .filter((item) => item.category === "earning" && !coreEarningTypes.has(item.adjustment_type))
      .map((item) => ({
        label: item.adjustment_type === "other_earnings" ? "Allowances" : pretty(item.adjustment_type),
        amount: item.amount,
        note: item.description,
      })),
  ];
  const deductionRows = [
    {
      label: "Late deduction",
      amount: record.late_deduction,
      note: `${record.total_late_minutes} late minutes.`,
    },
    {
      label: "Undertime deduction",
      amount: record.undertime_deduction,
      note: `${record.total_undertime_minutes} undertime minutes.`,
    },
    {
      label: "Absence deduction",
      amount: record.absence_deduction,
      note: `${record.total_absences} absence day${record.total_absences === 1 ? "" : "s"}.`,
    },
    {
      label: "Loan deductions",
      amount: loanDeductionTotal,
      note:
        loanRows.length > 0
          ? `${loanRows.length} scheduled employee loan deduction${loanRows.length === 1 ? "" : "s"} were applied.`
          : "No employee loan deductions were applied in this cutoff.",
    },
    ...(Number(residualOtherDeductions) > 0
      ? [
          {
            label: "Other deductions",
            amount: residualOtherDeductions,
            note: "Stored deductions outside the employee loan plan.",
          },
        ]
      : []),
    ...loanRows,
  ];
  const governmentRows = deductionBreakdowns
    .filter((item) => !isEmployeeLoanBreakdown(item.snapshot))
    .map((item) => ({
      label: item.deduction_name,
      amount: item.employee_share,
      note: `Basis ${formatCurrency(item.basis_amount)}${Number(item.employer_share) > 0 ? ` • Employer share ${formatCurrency(item.employer_share)}` : ""}`,
    }));
  const operationsDeductionTotal = sumAmountStrings([
    record.late_deduction,
    record.undertime_deduction,
    record.absence_deduction,
    record.other_deductions,
  ]);
  const computationNotes = [
    `Source ${pretty(record.calculation_source_status)}`,
    `Attendance review ${pretty(record.attendance_review_status)}`,
    ...flags(record),
    ...(record.review_remarks ? [`Review remarks: ${record.review_remarks}`] : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-950">{record.employee_name_snapshot}</h4>
          <p className="mt-1 text-xs text-slate-500">
            Review how the gross pay, deductions, and net pay were built for approval.
          </p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Net pay</p>
          <p className={cn("mt-1 text-lg font-semibold", Number(record.net_pay) < 0 ? "text-rose-700" : "text-slate-900")}>
            {formatCurrency(record.net_pay)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <BreakdownPanel
          title="Earnings"
          summaryLabel="Gross pay"
          summaryValue={record.gross_pay}
          tone="positive"
          rows={earningRows}
        />
        <BreakdownPanel
          title="Attendance / Loans"
          summaryLabel="Operational deductions"
          summaryValue={operationsDeductionTotal}
          tone="negative"
          rows={deductionRows}
        />
        <BreakdownPanel
          title="Government / Tax"
          summaryLabel="Employee deductions"
          summaryValue={record.government_deductions_total}
          tone="neutral"
          rows={governmentRows}
          footerNote={`Taxable income ${formatCurrency(record.taxable_income)} • Employer contribution ${formatCurrency(record.total_employer_contributions)}`}
        />
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
        <p className="text-sm font-semibold text-slate-950">Computation notes</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {computationNotes.map((item) => (
            <StatusPill key={item} label={item} tone="neutral" />
          ))}
        </div>
      </div>

      {canRecalculate ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-950">Dispute / review remarks</p>
              <p className="mt-1 text-xs text-slate-500">
                Add the reason before recalculating this employee only.
              </p>
              <textarea
                value={reviewRemarks}
                onChange={(event) => onReviewRemarksChange(event.target.value)}
                rows={3}
                disabled={submitting}
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="Example: disputed undertime, corrected approved overtime, manager confirmed missing log."
              />
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={onRecalculate}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
            >
              <RefreshCw className="h-4 w-4" />
              Recalculate employee
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EmployeeCutoffPreviewEmptyState({
  statusRecord,
}: {
  statusRecord: EmployeePayrollCutoffStatusRecord;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-amber-900">
            {statusRecord.employee_name}
          </p>
          <p className="mt-1 text-xs text-amber-800">
            {statusRecord.is_calculated
              ? "Calculated payroll details could not be loaded yet. Refresh the cutoff row and try again."
              : statusRecord.is_locked
              ? "Not yet calculated. Run Calculate for this employee to show the payroll breakdown here."
              : "This employee is not yet locked for payroll. Lock the row first, then calculate to see the result here."}
          </p>
        </div>
        <ReadinessBadge status={statusRecord.readiness_status} />
      </div>
      <EmployeeCutoffStatusNotes statusRecord={statusRecord} />
    </div>
  );
}

function EmployeeCutoffStatusNotes({
  statusRecord,
}: {
  statusRecord: EmployeePayrollCutoffStatusRecord;
}) {
  if (
    statusRecord.blocking_issues.length === 0 &&
    statusRecord.warnings.length === 0 &&
    !statusRecord.notes
  ) {
    return null;
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {statusRecord.blocking_issues.length > 0 ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {statusRecord.blocking_issues.join(" ")}
        </div>
      ) : null}
      {statusRecord.warnings.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {statusRecord.warnings.join(" ")}
        </div>
      ) : null}
      {statusRecord.notes ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 lg:col-span-2">
          {statusRecord.notes}
        </div>
      ) : null}
    </div>
  );
}

function BreakdownPanel({
  title,
  summaryLabel,
  summaryValue,
  tone,
  rows,
  footerNote,
}: {
  title: string;
  summaryLabel: string;
  summaryValue: string;
  tone: "positive" | "negative" | "neutral";
  rows: Array<{ label: string; amount: string; note: string }>;
  footerNote?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">{title}</p>
          <p className="mt-1 text-xs text-slate-500">{summaryLabel}</p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
            tone === "positive"
              ? "bg-emerald-100 text-emerald-700"
              : tone === "negative"
                ? "bg-rose-100 text-rose-700"
                : "bg-amber-100 text-amber-700",
          )}
        >
          {formatCurrency(summaryValue)}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{row.label}</p>
                <p className="mt-1 text-xs text-slate-500">{row.note}</p>
              </div>
              <span className="text-sm font-semibold text-slate-900">{formatCurrency(row.amount)}</span>
            </div>
          </div>
        ))}
      </div>
      {footerNote ? <p className="mt-3 text-xs text-amber-700">{footerNote}</p> : null}
    </div>
  );
}

function ReadinessBadge({ status }: { status: string }) {
  const normalized = status.trim().toLowerCase();
  const tone =
    normalized === "ready_to_lock"
      ? "success"
      : normalized === "locked" || normalized === "calculated" || normalized === "finalized"
        ? "info"
        : normalized === "for_review"
          ? "warning"
          : "danger";

  return <StatusPill label={pretty(status)} tone={tone} />;
}

function InlineStatusBadge({ value }: { value: string }) {
  const normalized = value.trim().toLowerCase();
  const tone =
    normalized === "approved" || normalized === "clear" || normalized === "not_required"
      ? "success"
      : normalized === "pending"
        ? "warning"
        : normalized === "issue"
          ? "danger"
          : "neutral";

  return <StatusPill label={pretty(value)} tone={tone} />;
}

function FlagMark({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning" | "neutral";
}) {
  return <StatusPill label={label} tone={tone} />;
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning" | "danger" | "info" | "neutral";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
        tone === "success"
          ? "bg-emerald-100 text-emerald-800"
          : tone === "warning"
            ? "bg-amber-100 text-amber-800"
            : tone === "danger"
              ? "bg-rose-100 text-rose-800"
              : tone === "info"
                ? "bg-sky-100 text-sky-800"
                : "bg-slate-100 text-slate-700",
      )}
    >
      {label}
    </span>
  );
}


function Card({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-3xl border border-slate-200/80 bg-white px-5 py-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p><p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p><p className="mt-2 text-sm text-slate-600">{detail}</p></div>;
}

function Banner({ children, tone }: { children: React.ReactNode; tone: "error" | "success" }) {
  return <div className={cn("rounded-2xl px-4 py-4 text-sm", tone === "error" ? "border border-rose-200 bg-rose-50 text-rose-800" : "border border-emerald-200 bg-emerald-50 text-emerald-800")}>{children}</div>;
}

function Action({
  icon: Icon,
  label,
  onClick,
  disabled,
  tone = "primary",
}: {
  icon: typeof RefreshCw;
  label: string;
  onClick: () => void;
  disabled: boolean;
  tone?: "primary" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed",
        tone === "danger"
          ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
          : "bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function Head({ children }: { children: React.ReactNode }) {
  return <th className="border-b border-slate-200/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{children}</th>;
}

function Cell({ children }: { children: React.ReactNode }) {
  return <td className="border-b border-slate-200/70 px-4 py-4 text-sm text-slate-600">{children}</td>;
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

function parseBreakdownSnapshot(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function isEmployeeLoanBreakdown(snapshot: Record<string, unknown> | null) {
  return snapshot?.source === "employee_loan";
}

function sumAmountStrings(amounts: string[]) {
  const totalCents = amounts.reduce(
    (currentValue, amount) => currentValue + Math.round(Number(amount || "0") * 100),
    0,
  );
  return (totalCents / 100).toFixed(2);
}

function subtractAmountStrings(total: string, value: string) {
  const differenceInCents =
    Math.round(Number(total || "0") * 100) - Math.round(Number(value || "0") * 100);
  return (Math.max(differenceInCents, 0) / 100).toFixed(2);
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
