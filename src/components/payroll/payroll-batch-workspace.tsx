"use client";

import Link from "next/link";
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
  finalizePayrollBatch,
  getEmployeePayrollCutoffPreview,
  getEmployeePayrollCutoffStatuses,
  getPayrollBatchDetail,
  getPayrollBatches,
  getPayrollCutoffPreviews,
  lockEmployeePayrollCutoff,
  normalizePayrollStatus,
  recalculateEmployeePayrollCutoff,
  recalculatePayrollBatch,
  recalculatePayrollRecord,
  releasePayrollBatchPayslips,
  reviewPayrollBatch,
  unlockEmployeePayrollCutoff,
} from "@/lib/api/payroll";
import {
  canApprovePayroll,
  canFinalizePayroll,
  canManagePayroll,
  canReleasePayslips,
  canReviewPayroll,
  type AppRole,
} from "@/lib/auth/session";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import {
  preserveCurrentValue,
  preserveCurrentValues,
} from "@/lib/preserved-collection-state";
import { usePreservedScroll } from "@/lib/use-preserved-scroll";
import { cn } from "@/lib/utils";
import { ManualAdjustmentsPanel } from "@/components/payroll/manual-adjustments-panel";
import type {
  EmployeePayrollCutoffPreviewRecord,
  EmployeePayrollCutoffStatusRecord,
  PayrollAttendanceLineItemRecord,
  PayrollBatchDetailRecord,
  PayrollBatchSummaryRecord,
  PayrollCutoffPreviewRecord,
  PayrollRecordRecord,
} from "@/types/payroll";

type Props = {
  role: AppRole | null;
};

type BreakdownRow = {
  id: string;
  label: string;
  amount: string;
  note: string;
  details?: BreakdownRowDetail[];
};

type BreakdownRowDetail = {
  id: string;
  title: string;
  amount: string;
  fields: {
    label: string;
    value: string;
  }[];
};

type BreakdownSection = {
  eyebrow: string;
  title: string;
  description: string;
  summaryLabel: string;
  summaryValue: string;
  rows: BreakdownRow[];
  tone: "positive" | "negative" | "neutral";
  footerNote?: string;
};

const PAYROLL_REFRESH_INTERVAL_MS = 5000;

export function PayrollBatchWorkspace({ role }: Props) {
  const canManage = canManagePayroll(role);
  const canReview = canReviewPayroll(role);
  const canApprove = canApprovePayroll(role);
  const canFinalize = canFinalizePayroll(role);
  const canRelease = canReleasePayslips(role);
  const batchListRef = useRef<HTMLDivElement | null>(null);
  const batchDetailRef = useRef<HTMLDivElement | null>(null);
  const { captureScrollPosition, restoreScrollPosition } = usePreservedScroll();
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
  const [activeEmployeeActionKey, setActiveEmployeeActionKey] = useState<string | null>(null);
  const [cutoffEmployeeFeedback, setCutoffEmployeeFeedback] = useState<{
    tone: "error" | "success";
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (cutoffEmployeeFeedback == null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCutoffEmployeeFeedback(null);
    }, 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [cutoffEmployeeFeedback]);

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
      const availableCutoffIds = nextCutoffs.map((item) => item.cutoff.id);
      const nextCutoffId = preserveCurrentValue(availableCutoffIds, cutoffId);
      setCutoffId(nextCutoffId);
      const availableBatchIds = nextBatches.map((item) => item.id);
      const fallbackBatchId =
        nextCutoffs.find((item) => item.cutoff.id === nextCutoffId)?.existing_batch_id ?? null;
      const nextBatchId = preserveCurrentValue(
        availableBatchIds,
        preferredBatchId ?? batchId,
        { fallbackValue: fallbackBatchId },
      );
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
      const preservedEmployeeId = preserveCurrentValue(
        nextStatuses.map((item) => item.employee_id),
        employeePreviewStatus?.employee_id ?? null,
        { preferFirst: false },
      );
      setEmployeePreviewStatus(
        preservedEmployeeId == null
          ? null
          : nextStatuses.find((item) => item.employee_id === preservedEmployeeId) ?? null,
      );
      if (preservedEmployeeId == null) {
        setEmployeePreview(null);
      }
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
  }, [employeePreviewStatus?.employee_id]);

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
          preserveCurrentValues(
            detail.records.map((record) => record.id),
            currentValue,
          ),
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
  const calculatedBatchCount = useMemo(
    () => batches.filter((item) => item.status === "calculated").length,
    [batches],
  );
  const reviewedBatchCount = useMemo(
    () => batches.filter((item) => item.status === "reviewed").length,
    [batches],
  );
  const finalizedBatchCount = useMemo(
    () => batches.filter((item) => item.status === "finalized").length,
    [batches],
  );
  const releasedBatchCount = useMemo(
    () => batches.filter((item) => item.status === "payslip_released" || item.status === "posted").length,
    [batches],
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
  const batchIsReadOnly =
    batch?.status === "finalized"
    || batch?.status === "payslip_released"
    || batch?.status === "posted"
    || batch?.status === "locked";
  const batchLifecycleMessage = batch ? getLifecycleMessage(batch.status) : null;

  const refreshManualAdjustmentContext = useCallback(async () => {
    if (cutoffId != null) {
      await loadCutoffEmployees(cutoffId, { background: true });
    }
    if (batchId != null) {
      const nextBatch = await getPayrollBatchDetail(batchId);
      setBatch(nextBatch);
      setRemarks(nextBatch.remarks ?? "");
    }
    await loadOverview(batchId, { background: true });
  }, [batchId, cutoffId, loadCutoffEmployees, loadOverview]);

  function focusPayrollBatch(
    nextBatchId: number | null,
    nextCutoffId?: number | null,
    options?: { scroll?: boolean },
  ) {
    setError(null);
    setMessage(null);
    if (nextCutoffId !== undefined) {
      setCutoffId(nextCutoffId);
    }
    setBatchId(nextBatchId);

    if (options?.scroll) {
      window.setTimeout(() => {
        const target = batchDetailRef.current ?? batchListRef.current;
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
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
    const scrollPosition = captureScrollPosition();
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
      restoreScrollPosition(scrollPosition);
    }
  }

  async function loadEmployeePreview(
    statusRecord: EmployeePayrollCutoffStatusRecord,
    options?: { forceOpen?: boolean },
  ) {
    const alreadyOpen = employeePreviewStatus?.employee_id === statusRecord.employee_id;

    if (alreadyOpen && !options?.forceOpen) {
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

    const scrollPosition = captureScrollPosition();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    setCutoffEmployeeFeedback(null);
    setActiveEmployeeActionKey(
      statusRecord && (action === "calculate" || action === "recalculate")
        ? getEmployeeActionKey(action, statusRecord)
        : null,
    );
    try {
      let preferredBatchId = batchId;
      if (action === "evaluate") {
        const nextStatuses = await evaluateEmployeePayrollCutoffStatuses(activeCutoffId);
        setCutoffEmployeeStatuses(nextStatuses);
        setCutoffEmployeeFeedback({
          tone: "success",
          message: "Employee payroll readiness was re-evaluated for this cutoff.",
        });
        await loadOverview(preferredBatchId, { background: true });
        return;
      }

      if (statusRecord == null) {
        return;
      }

      if (action === "lock") {
        await lockEmployeePayrollCutoff(statusRecord.cutoff_id, statusRecord.employee_id);
        setCutoffEmployeeFeedback({
          tone: "success",
          message: `Locked ${statusRecord.employee_name} for payroll.`,
        });
      } else if (action === "unlock") {
        await unlockEmployeePayrollCutoff(statusRecord.cutoff_id, statusRecord.employee_id);
        setCutoffEmployeeFeedback({
          tone: "success",
          message: `Unlocked ${statusRecord.employee_name} from payroll.`,
        });
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
        setCutoffEmployeeFeedback({
          tone: "success",
          message:
            action === "calculate"
              ? `Calculated payroll for ${statusRecord.employee_name}.`
              : `Recalculated payroll for ${statusRecord.employee_name}.`,
        });
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
            await loadEmployeePreview(refreshedStatus, { forceOpen: true });
          }
        }
      }
    } catch (nextError) {
      setCutoffEmployeeFeedback({
        tone: "error",
        message:
          nextError instanceof Error
            ? nextError.message
            : "Unable to update the employee payroll cutoff status.",
      });
    } finally {
      setActiveEmployeeActionKey(null);
      setSubmitting(false);
      restoreScrollPosition(scrollPosition);
    }
  }

  async function runAction(
    action:
      | "calculate"
      | "recalculate"
      | "review"
      | "approve"
      | "finalize"
      | "release"
      | "discard",
  ) {
    const currentBatch = batch;
    const currentBatchId = currentBatch?.id ?? null;
    const canRunAction =
      action === "calculate" || action === "recalculate" || action === "discard"
        ? canManage
        : action === "review"
          ? canReview
          : action === "approve"
            ? canApprove
            : action === "finalize"
              ? canFinalize
              : canRelease;

    if (action === "calculate" && (!selectedCutoff || !canRunAction)) {
      return;
    }
    if (action !== "calculate" && (currentBatchId == null || !canRunAction)) {
      return;
    }
    const ensuredBatchId = currentBatchId ?? 0;
    if (action === "review" && !window.confirm("Mark this payroll batch as reviewed?")) {
      return;
    }
    if (action === "approve" && !window.confirm("Approve this payroll batch?")) {
      return;
    }
    if (action === "finalize" && !window.confirm("Finalize this payroll batch? Edits and recalculation will be blocked after this step.")) {
      return;
    }
    if (action === "release" && !window.confirm("Release payslips for this finalized payroll batch? Employees will be able to access them after release.")) {
      return;
    }
    if (
      action === "discard" &&
      !window.confirm(
        "Discard this unfinalized payroll batch? This will remove the computed batch, employee records, and any unreleased payslip rows for this cutoff.",
      )
    ) {
      return;
    }
    const scrollPosition = captureScrollPosition();
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
              : action === "review"
                ? await reviewPayrollBatch(ensuredBatchId, { remarks })
              : action === "approve"
                ? await approvePayrollBatch(ensuredBatchId, { remarks })
                : action === "finalize"
                  ? await finalizePayrollBatch(ensuredBatchId, { remarks })
                  : await releasePayrollBatchPayslips(ensuredBatchId, { remarks });
        setBatch(nextBatch);
        setBatchId(nextBatch.id);
        setRemarks(nextBatch.remarks ?? remarks);
        setMessage(
          action === "calculate"
            ? `Payroll batch for ${label(nextBatch.cutoff.cutoff_start, nextBatch.cutoff.cutoff_end)} was calculated.`
            : action === "recalculate"
              ? `Payroll batch for ${label(nextBatch.cutoff.cutoff_start, nextBatch.cutoff.cutoff_end)} was recalculated.`
              : action === "review"
                ? `Payroll batch for ${label(nextBatch.cutoff.cutoff_start, nextBatch.cutoff.cutoff_end)} was reviewed.`
              : action === "approve"
                ? `Payroll batch for ${label(nextBatch.cutoff.cutoff_start, nextBatch.cutoff.cutoff_end)} was approved.`
                : action === "finalize"
                  ? `Payroll batch for ${label(nextBatch.cutoff.cutoff_start, nextBatch.cutoff.cutoff_end)} was finalized.`
                  : `Payslips for ${label(nextBatch.cutoff.cutoff_start, nextBatch.cutoff.cutoff_end)} were released.`
        );
        await loadOverview(nextBatch.id);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to update payroll batch.");
    } finally {
      setSubmitting(false);
      restoreScrollPosition(scrollPosition);
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
        <Card label="Calculated" value={String(calculatedBatchCount)} detail="Batches waiting for finance review." />
        <Card label="Reviewed" value={String(reviewedBatchCount)} detail="Reviewed batches waiting for approval." />
        <Card label="Released" value={String(releasedBatchCount)} detail={`Finalized pending release: ${finalizedBatchCount}`} />
      </section>

      {error ? <Banner tone="error">{error}</Banner> : null}
      {message ? <Banner tone="success">{message}</Banner> : null}

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="panel-strong p-5 sm:p-6">
          <div className="ui-section-header flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Cutoff readiness</h2>
              <p className="mt-1 text-sm text-slate-600">Select a cutoff, review the employee readiness rows below, and calculate batch payroll from the locked employees.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const scrollPosition = captureScrollPosition();
                void loadOverview(batchId).finally(() => {
                  restoreScrollPosition(scrollPosition);
                });
              }}
              className="ui-button-secondary h-10 px-4"
            >
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
                  className={cn(
                    "w-full rounded-[24px] border px-4 py-4 text-left transition",
                    active
                      ? "border-sky-300 bg-sky-50/90 text-slate-950 shadow-[inset_4px_0_0_0_rgba(2,132,199,0.7)]"
                      : "border-slate-200/80 bg-slate-50/70 hover:border-slate-300 hover:bg-white",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{label(item.cutoff.cutoff_start, item.cutoff.cutoff_end)}</p>
                      <p className={cn("mt-1 text-xs", active ? "text-sky-700" : "text-slate-500")}>
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
                <div className="ui-state-banner ui-state-banner-warning">
                  {selectedCutoffActionHint}
                </div>
              ) : null}
              <div className="ui-action-bar ui-sticky-band flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={submitting || !selectedCutoff.can_calculate || selectedCutoffHasExistingBatch}
                  onClick={() => void runAction("calculate")}
                  className="ui-button-primary px-5"
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
                        { scroll: true },
                      );
                      setMessage(
                        `Opened the payroll batch for ${label(selectedCutoff.cutoff.cutoff_start, selectedCutoff.cutoff.cutoff_end)} below.`,
                      );
                    }}
                    className="ui-button-secondary px-5"
                  >
                    Open payroll batch
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <div ref={batchListRef} className="panel-strong p-5 sm:p-6">
          <div className="ui-section-header">
            <h2 className="text-lg font-semibold text-slate-950">Payroll batches</h2>
            <p className="mt-1 text-sm text-slate-600">Review computed payroll before approval and posting.</p>
          </div>
          <div className="mt-5 space-y-3">
            {batches.length > 0 ? batches.map((item) => {
              const active = item.id === batchId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    focusPayrollBatch(item.id, item.cutoff.id, { scroll: true });
                  }}
                  className={cn(
                    "w-full rounded-[24px] border px-4 py-4 text-left transition",
                    active
                      ? "border-sky-300 bg-sky-50/90 text-slate-950 shadow-[inset_4px_0_0_0_rgba(2,132,199,0.7)]"
                      : "border-slate-200/80 bg-slate-50/70 hover:border-slate-300 hover:bg-white",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{label(item.cutoff.cutoff_start, item.cutoff.cutoff_end)}</p>
                      <p className={cn("mt-1 text-xs", active ? "text-sky-700" : "text-slate-500")}>
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

      <section className="panel-strong p-5 sm:p-6">
        <div className="ui-section-header flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Cutoff employee payroll control</h2>
            <p className="mt-1 text-sm text-slate-600">
              Review readiness per employee, lock eligible rows, then calculate payroll without waiting for the whole cutoff.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                const scrollPosition = captureScrollPosition();
                void loadCutoffEmployees(cutoffId).finally(() => {
                  restoreScrollPosition(scrollPosition);
                });
              }}
              className="ui-button-secondary h-10 px-4"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            {canManage ? (
              <button
                type="button"
                disabled={submitting || cutoffId == null}
                onClick={() => void runEmployeeCutoffAction("evaluate")}
                className="ui-button-primary h-10 px-4"
              >
                <CheckCircle2 className="h-4 w-4" />
                Re-evaluate
              </button>
            ) : null}
          </div>
        </div>

        <div className="ui-toolbar mt-5 flex flex-wrap gap-2">
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
                  ? "bg-slate-900 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {cutoffEmployeeFeedback ? (
          <div className="mt-4">
            <Banner tone={cutoffEmployeeFeedback.tone}>
              {cutoffEmployeeFeedback.message}
            </Banner>
          </div>
        ) : null}

        <div className="ui-table-shell mt-5">
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
                    <Head>Adjustments</Head>
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
                    const calculating =
                      activeEmployeeActionKey === getEmployeeActionKey("calculate", item);
                    const recalculating =
                      activeEmployeeActionKey === getEmployeeActionKey("recalculate", item);
                    const showIssues = item.blocking_issues[0] ?? item.warnings[0] ?? item.notes ?? "Clear";

                    return (
                      <Fragment key={item.id}>
                        <tr className={cn("ui-table-row", previewOpen && "ui-table-row-selected")}>
                          <Cell>
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => void runEmployeeCutoffAction("review", item)}
                              className={cn(
                                "inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400",
                                previewOpen
                                  ? "border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100"
                                  : "border-slate-200 text-slate-700 hover:bg-slate-50",
                              )}
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
                          <Cell><InlineStatusBadge value={item.adjustment_status} /></Cell>
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
                                    <RefreshCw className={cn("h-3.5 w-3.5", recalculating && "animate-spin")} />
                                    {recalculating ? "Recalculating..." : "Recalculate"}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={submitting || calculateDisabled}
                                    onClick={() => void runEmployeeCutoffAction("calculate", item)}
                                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-300 disabled:text-white"
                                  >
                                    <Calculator className={cn("h-3.5 w-3.5", calculating && "animate-pulse")} />
                                    {calculating ? "Calculating..." : "Calculate"}
                                  </button>
                                )
                              ) : null}
                            </div>
                          </Cell>
                        </tr>
                        {previewOpen ? (
                          <tr className="ui-table-row-expanded">
                            <td colSpan={11} className="border-b border-slate-200/70 px-4 py-5">
                              {loadingEmployeePreview ? (
                                <ResourceTableSkeleton rowCount={3} />
                              ) : item.is_calculated && employeePreview ? (
                                <div className="ui-expanded-panel space-y-4">
                                  <div className="flex flex-wrap items-center justify-between gap-3">
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
                                <div className="ui-expanded-panel">
                                  <EmployeeCutoffPreviewEmptyState statusRecord={item} />
                                </div>
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

      <ManualAdjustmentsPanel
        role={role}
        cutoffId={selectedCutoff?.cutoff.id ?? null}
        cutoffLabel={
          selectedCutoff
            ? label(selectedCutoff.cutoff.cutoff_start, selectedCutoff.cutoff.cutoff_end)
            : null
        }
        employees={cutoffEmployeeStatuses}
        hasExistingBatch={selectedCutoffHasExistingBatch}
        onAdjustmentsChanged={refreshManualAdjustmentContext}
      />

      <div ref={batchDetailRef} className="panel-strong p-5 sm:p-6">
        {loadingBatch ? <ResourceTableSkeleton rowCount={5} /> : !batch ? (
          <ResourceEmptyState title="Select a payroll batch" description="Choose a batch to inspect the employee-level payroll breakdown." />
        ) : (
          <div className="space-y-5">
            <div className="ui-section-header flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold text-slate-950">{label(batch.cutoff.cutoff_start, batch.cutoff.cutoff_end)}</h2>
                  <PayrollStatusBadge status={normalizePayrollStatus(batch.status)} />
                </div>
                <p className="mt-2 text-sm text-slate-600">{batch.records_using_system_defaults} records used system-computed attendance defaults.</p>
                <div className="mt-3">
                  <Link
                    href={`/payroll/reconciliation/${batch.id}`}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                  >
                    Open reconciliation view
                  </Link>
                </div>
              </div>
              <div className="ui-action-bar ui-sticky-band grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {canManage && !batchIsReadOnly ? <Action icon={RefreshCw} label="Recalculate" disabled={submitting} onClick={() => void runAction("recalculate")} /> : null}
                {canReview && batch.status === "calculated" ? <Action icon={CheckCircle2} label="Mark reviewed" disabled={submitting} onClick={() => void runAction("review")} /> : null}
                {canApprove && batch.status === "reviewed" ? <Action icon={CheckCircle2} label="Approve" disabled={submitting} onClick={() => void runAction("approve")} /> : null}
                {canFinalize && batch.status === "approved" ? <Action icon={Lock} label="Finalize" disabled={submitting} onClick={() => void runAction("finalize")} /> : null}
                {canRelease && batch.status === "finalized" ? <Action icon={Send} label="Release payslips" disabled={submitting} onClick={() => void runAction("release")} /> : null}
                {canManage && !batchIsReadOnly ? <Action icon={Trash2} label="Discard batch" disabled={submitting} tone="danger" onClick={() => void runAction("discard")} /> : null}
              </div>
            </div>

            {batchLifecycleMessage ? (
              <div className={cn(
                "rounded-2xl border px-4 py-4 text-sm",
                batch.status === "payslip_released" || batch.status === "posted"
                  ? "border-emerald-200 bg-emerald-50/70 text-emerald-800"
                  : batch.status === "finalized"
                    ? "border-slate-200 bg-slate-50/80 text-slate-700"
                    : "border-amber-200 bg-amber-50/80 text-amber-800",
              )}>
                {batchLifecycleMessage}
              </div>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-[24px] border border-slate-200/80 bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Lifecycle</p>
                <div className="mt-4 grid gap-3 md:grid-cols-5">
                  {buildLifecycleSteps(batch).map((step) => (
                    <div
                      key={step.label}
                      className={cn(
                        "rounded-2xl border px-4 py-3",
                        step.completed
                          ? "border-emerald-200 bg-emerald-50/70"
                          : step.current
                            ? "border-sky-200 bg-sky-50/70"
                            : "border-slate-200 bg-slate-50/70",
                      )}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{step.label}</p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">{step.state}</p>
                      <p className="mt-1 text-xs text-slate-500">{step.timestamp ? formatDateTime(step.timestamp) : "Pending"}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Operational summary</p>
                <div className="mt-4 grid gap-3">
                  <Mini label="Records" value={String(batch.record_count)} active />
                  <Mini label="Gross" value={formatCurrency(batch.total_gross_pay)} active />
                  <Mini label="Net" value={formatCurrency(batch.total_net_pay)} active />
                  <Mini label="Flags" value={String(batch.records_with_flags)} active={batch.records_with_flags > 0} />
                </div>
              </div>
            </div>

            <textarea
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              rows={3}
              disabled={submitting || (!canManage && !canReview && !canApprove && !canFinalize && !canRelease)}
              className="ui-textarea min-h-24 bg-slate-50/70"
              placeholder="Payroll lifecycle remarks"
            />

            <div className="ui-table-shell">
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
                        canManage && !batchIsReadOnly;

                      return (
                        <Fragment key={item.id}>
                          <tr
                            className={cn("ui-table-row", expanded && "ui-table-row-selected")}
                          >
                            <Cell>
                              <div className="flex flex-col items-start gap-2">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    toggleRecordExpansion(item.id);
                                  }}
                                  className={cn(
                                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                                    expanded
                                      ? "border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100"
                                      : "border-slate-200 text-slate-700 hover:bg-slate-50",
                                  )}
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
                            <tr className="ui-table-row-expanded">
                              <td colSpan={7} className="border-b border-slate-200/70 px-4 py-5">
                                <div className="ui-expanded-panel">
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
                                </div>
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
      id: `loan-${item.id}`,
      label: item.deduction_name,
      amount: item.employee_share,
      note:
        typeof item.snapshot?.installment_number === "number"
          ? `Employee loan installment #${item.snapshot.installment_number}.`
          : "Employee loan deduction for this cutoff.",
    }));
  const loanDeductionTotal = sumAmountStrings(loanRows.map((item) => item.amount));
  const manualAdditionRows = record.adjustments
    .filter(
      (item) => item.category === "earning" && item.adjustment_type.startsWith("manual_"),
    )
    .map((item) => ({
      id: `manual-addition-${item.id}`,
      label: pretty(item.adjustment_type),
      amount: item.amount,
      note: item.description,
    }));
  const manualDeductionRows = record.adjustments
    .filter(
      (item) => item.category === "deduction" && item.adjustment_type.startsWith("manual_"),
    )
    .map((item) => ({
      id: `manual-deduction-${item.id}`,
      label: pretty(item.adjustment_type),
      amount: item.amount,
      note: item.description,
    }));
  const manualDeductionTotal = sumAmountStrings(
    manualDeductionRows.map((item) => item.amount),
  );
  const residualOtherDeductions = subtractAmountStrings(
    record.other_deductions,
    sumAmountStrings([loanDeductionTotal, manualDeductionTotal]),
  );
  const allowanceRows = record.adjustments
    .filter(
      (item) =>
        item.category === "earning"
        && !coreEarningTypes.has(item.adjustment_type)
        && !item.adjustment_type.startsWith("manual_"),
    )
    .map((item) => ({
      id: `allowance-${item.id}`,
      label: item.adjustment_type === "other_earnings" ? "Allowance pool" : pretty(item.adjustment_type),
      amount: item.amount,
      note: item.description,
    }));
  const lateLineItems = record.attendance_line_items.filter(
    (item) => item.category === "late_deduction",
  );
  const absenceLineItems = record.attendance_line_items.filter(
    (item) => item.category === "absence_deduction",
  );
  const undertimeLineItems = record.attendance_line_items.filter(
    (item) => item.category === "undertime_deduction",
  );
  const overtimeLineItems = record.attendance_line_items.filter(
    (item) => item.category === "overtime_pay",
  );
  const nightDifferentialLineItems = record.attendance_line_items.filter(
    (item) => item.category === "night_differential_pay",
  );
  const earningRows = [
    {
      id: "earning-basic-pay",
      label: "Basic pay",
      amount: record.basic_pay,
      note: "Base pay for the selected cutoff period.",
    },
    buildAttendanceBreakdownRow({
      id: "earning-overtime-pay",
      label: "Overtime pay",
      amount: record.overtime_pay,
      note: `${record.total_overtime_minutes} approved overtime minutes were included.`,
      lineItems: overtimeLineItems,
    }),
    buildAttendanceBreakdownRow({
      id: "earning-night-differential",
      label: "Night differential",
      amount: record.night_differential_pay,
      note: `${record.total_night_differential_minutes} night differential minutes were included.`,
      lineItems: nightDifferentialLineItems,
    }),
  ];
  const deductionRows = [
    buildAttendanceBreakdownRow({
      id: "deduction-absence",
      label: "Absence deduction",
      amount: record.absence_deduction,
      note: `${record.total_absences} absence day${record.total_absences === 1 ? "" : "s"}.`,
      lineItems: absenceLineItems,
    }),
    buildAttendanceBreakdownRow({
      id: "deduction-late",
      label: "Late deduction",
      amount: record.late_deduction,
      note: `${record.total_late_minutes} late minutes.`,
      lineItems: lateLineItems,
    }),
    buildAttendanceBreakdownRow({
      id: "deduction-undertime",
      label: "Undertime deduction",
      amount: record.undertime_deduction,
      note: `${record.total_undertime_minutes} undertime minutes.`,
      lineItems: undertimeLineItems,
    }),
    ...(Number(residualOtherDeductions) > 0
      ? [
          {
            id: "deduction-other",
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
      id: `government-${item.id}`,
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
  const totalDeductions = sumAmountStrings([
    operationsDeductionTotal,
    record.government_deductions_total,
  ]);
  const visibleEarningRows = filterRowsWithAmounts(earningRows);
  const visibleAllowanceRows = filterRowsWithAmounts(allowanceRows);
  const visibleManualAdditionRows = filterRowsWithAmounts(manualAdditionRows);
  const visibleDeductionRows = filterRowsWithAmounts(deductionRows);
  const visibleManualDeductionRows = filterRowsWithAmounts(manualDeductionRows);
  const visibleGovernmentRows = filterRowsWithAmounts(governmentRows);
  const earningSections: BreakdownSection[] = [
    ...(visibleEarningRows.length > 0
      ? [
          {
            eyebrow: "Salary components",
            title: "Salary and time-based earnings",
            description: "Included base pay plus approved time-based earnings for this cutoff.",
            summaryLabel: "Earnings total",
            summaryValue: sumAmountStrings(visibleEarningRows.map((item) => item.amount)),
            rows: visibleEarningRows,
            tone: "positive" as const,
          },
        ]
      : []),
    ...(visibleAllowanceRows.length > 0
      ? [
          {
            eyebrow: "Allowances",
            title:
              visibleAllowanceRows.length === 1
                ? "1 allowance added to gross pay"
                : `${visibleAllowanceRows.length} allowances added to gross pay`,
            description: "Recurring and manual extras that were added to this cutoff.",
            summaryLabel: "Allowance total",
            summaryValue: sumAmountStrings(visibleAllowanceRows.map((item) => item.amount)),
            rows: visibleAllowanceRows,
            tone: "positive" as const,
          },
        ]
      : []),
    ...(visibleManualAdditionRows.length > 0
      ? [
          {
            eyebrow: "Manual entries",
            title: "Approved manual additions",
            description: "One-time payroll additions approved specifically for this cutoff.",
            summaryLabel: "Manual addition total",
            summaryValue: sumAmountStrings(visibleManualAdditionRows.map((item) => item.amount)),
            rows: visibleManualAdditionRows,
            tone: "positive" as const,
          },
        ]
      : []),
  ];
  const deductionSections: BreakdownSection[] = [
    ...(visibleManualDeductionRows.length > 0
      ? [
          {
            eyebrow: "Manual entries",
            title: "Approved manual deductions",
            description: "One-time payroll deductions approved specifically for this cutoff.",
            summaryLabel: "Manual deduction total",
            summaryValue: sumAmountStrings(
              visibleManualDeductionRows.map((item) => item.amount),
            ),
            rows: visibleManualDeductionRows,
            tone: "negative" as const,
          },
        ]
      : []),
    ...(visibleDeductionRows.length > 0
      ? [
          {
            eyebrow: "Attendance / loans",
            title: "Operational deductions",
            description: "Attendance, absence, undertime, and employee loan deductions for this cutoff.",
            summaryLabel: "Deduction total",
            summaryValue: sumAmountStrings(visibleDeductionRows.map((item) => item.amount)),
            rows: visibleDeductionRows,
            tone: "negative" as const,
          },
        ]
      : []),
    ...(visibleGovernmentRows.length > 0
      ? [
          {
            eyebrow: "Government / tax",
            title: "Statutory deductions",
            description: "Government shares and withholding items charged to the employee.",
            summaryLabel: "Deduction total",
            summaryValue: sumAmountStrings(visibleGovernmentRows.map((item) => item.amount)),
            rows: visibleGovernmentRows,
            tone: "neutral" as const,
            footerNote: `Taxable income ${formatCurrency(record.taxable_income)} • Employer contribution ${formatCurrency(record.total_employer_contributions)}`,
          },
        ]
      : []),
  ];
  const computationNotes = [
    `Source ${pretty(record.calculation_source_status)}`,
    `Attendance review ${pretty(record.attendance_review_status)}`,
    ...(visibleManualAdditionRows.length > 0 || visibleManualDeductionRows.length > 0
      ? [
          `${visibleManualAdditionRows.length + visibleManualDeductionRows.length} approved manual adjustment${visibleManualAdditionRows.length + visibleManualDeductionRows.length === 1 ? "" : "s"}`,
        ]
      : []),
    ...flags(record),
    ...(record.review_remarks ? [`Review remarks: ${record.review_remarks}`] : []),
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-slate-200/80 bg-linear-to-r from-white via-slate-50 to-emerald-50/60 p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Sahod</p>
            <p className="mt-1 text-lg font-semibold text-slate-950">{formatCurrency(record.gross_pay)}</p>
            <p className="mt-1 text-xs text-slate-500">Kabuuang earnings bago kaltas.</p>
          </div>
          <div className="rounded-2xl border border-rose-200/80 bg-rose-50/80 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-700">
              Total deduction
            </p>
            <p className="mt-1 text-lg font-semibold text-rose-700">{formatCurrency(totalDeductions)}</p>
            <p className="mt-1 text-xs text-rose-600">Kasama ang attendance, loans, government, at tax deductions.</p>
          </div>
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Take-home pay
            </p>
            <p className={cn("mt-1 text-lg font-semibold", Number(record.net_pay) < 0 ? "text-rose-700" : "text-emerald-700")}>
              {formatCurrency(record.net_pay)}
            </p>
            <p className="mt-1 text-xs text-emerald-700/80">Final net pay for this employee in the selected cutoff.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <BreakdownPanel
          title="Earnings"
          summaryLabel="Total earnings"
          summaryValue={record.gross_pay}
          tone="positive"
          sections={earningSections}
          emptyMessage="No earnings with a value were generated for this cutoff."
        />
        <BreakdownPanel
          title="Deductions"
          summaryLabel="Total deductions"
          summaryValue={totalDeductions}
          tone="negative"
          sections={deductionSections}
          emptyMessage="No deductions with a value were applied for this cutoff."
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
        <p className="text-xs text-amber-800">
          {statusRecord.is_calculated
            ? "Calculated payroll details could not be loaded yet. Refresh the cutoff row and try again."
            : statusRecord.is_locked
            ? "Not yet calculated. Run Calculate for this employee to show the payroll breakdown here."
            : "This employee is not yet locked for payroll. Lock the row first, then calculate to see the result here."}
        </p>
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
        <div className="ui-state-banner ui-state-banner-error">
          {statusRecord.blocking_issues.join(" ")}
        </div>
      ) : null}
      {statusRecord.warnings.length > 0 ? (
        <div className="ui-state-banner ui-state-banner-warning">
          {statusRecord.warnings.join(" ")}
        </div>
      ) : null}
      {statusRecord.notes ? (
        <div className="ui-state-banner ui-state-banner-info lg:col-span-2">
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
  sections,
  emptyMessage,
}: {
  title: string;
  summaryLabel: string;
  summaryValue: string;
  tone: "positive" | "negative" | "neutral";
  sections: BreakdownSection[];
  emptyMessage: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);
  const itemCount = sections.reduce((count, section) => count + section.rows.length, 0);

  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white/88 p-4 shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((currentValue) => !currentValue)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-slate-950">{title}</p>
          <p className="mt-1 text-xs text-slate-500">{summaryLabel}</p>
          <p className="mt-2 text-xs text-slate-400">
            {itemCount === 0 ? "No items with value" : `${itemCount} item${itemCount === 1 ? "" : "s"} with value`}
          </p>
        </div>
        <div className="flex items-start gap-3">
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
          <span className="mt-1 text-slate-400">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </div>
      </button>
      {expanded ? (
        <div className="mt-4 space-y-4">
          {sections.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5 text-sm text-slate-500">
              {emptyMessage}
            </div>
          ) : (
            sections.map((section, sectionIndex) => (
              <div
                key={`${section.title}-${sectionIndex}`}
                className={cn(
                  "rounded-[28px] border p-4 shadow-sm",
                  section.tone === "positive"
                    ? "border-emerald-200/80 bg-linear-to-br from-emerald-50 via-white to-teal-50"
                    : section.tone === "negative"
                      ? "border-rose-200/80 bg-linear-to-br from-rose-50 via-white to-orange-50"
                      : "border-amber-200/80 bg-linear-to-br from-amber-50 via-white to-yellow-50",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p
                      className={cn(
                        "text-[11px] font-semibold uppercase tracking-[0.18em]",
                        section.tone === "positive"
                          ? "text-emerald-700"
                          : section.tone === "negative"
                            ? "text-rose-700"
                            : "text-amber-700",
                      )}
                    >
                      {section.eyebrow}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">{section.title}</p>
                    <p className="mt-1 text-xs text-slate-600">{section.description}</p>
                  </div>
                  <div className="rounded-2xl border border-white/90 bg-white/90 px-3 py-2 text-right shadow-sm">
                    <p
                      className={cn(
                        "text-[11px] font-semibold uppercase tracking-[0.16em]",
                        section.tone === "positive"
                          ? "text-emerald-700"
                          : section.tone === "negative"
                            ? "text-rose-700"
                            : "text-amber-700",
                      )}
                    >
                      {section.summaryLabel}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {formatCurrency(section.summaryValue)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2">
                  {section.rows.map((row, index) => (
                    <div
                      key={row.id || `${row.label}-${row.amount}-${index}`}
                      className="rounded-2xl border border-white/90 bg-white/85 px-4 py-3"
                    >
                      {row.details && row.details.length > 0 ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedRowIds((currentValue) =>
                                currentValue.includes(row.id)
                                  ? currentValue.filter((item) => item !== row.id)
                                  : [...currentValue, row.id],
                              )
                            }
                            className="flex w-full items-start justify-between gap-3 text-left"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-950">{row.label}</p>
                              <p className="mt-1 text-xs leading-5 text-slate-500">{row.note}</p>
                              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                {row.details.length} source entr{row.details.length === 1 ? "y" : "ies"}
                              </p>
                            </div>
                            <div className="flex items-start gap-3">
                              <span
                                className={cn(
                                  "whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
                                  section.tone === "positive"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : section.tone === "negative"
                                      ? "bg-rose-100 text-rose-800"
                                      : "bg-amber-100 text-amber-800",
                                )}
                              >
                                {formatCurrency(row.amount)}
                              </span>
                              <span className="mt-1 text-slate-400">
                                {expandedRowIds.includes(row.id) ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </span>
                            </div>
                          </button>
                          {expandedRowIds.includes(row.id) ? (
                            <div className="mt-3 grid gap-2">
                              {row.details.map((detail) => (
                                <div
                                  key={detail.id}
                                  className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3"
                                >
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold text-slate-900">{detail.title}</p>
                                    </div>
                                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                                      {formatCurrency(detail.amount)}
                                    </span>
                                  </div>
                                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                                    {detail.fields.map((field) => (
                                      <div key={`${detail.id}-${field.label}`} className="min-w-0">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                          {field.label}
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-slate-600">{field.value}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-950">{row.label}</p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">{row.note}</p>
                          </div>
                          <span
                            className={cn(
                              "whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
                              section.tone === "positive"
                                ? "bg-emerald-100 text-emerald-800"
                                : section.tone === "negative"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-amber-100 text-amber-800",
                            )}
                          >
                            {formatCurrency(row.amount)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {section.footerNote ? <p className="mt-3 text-xs text-amber-700">{section.footerNote}</p> : null}
              </div>
            ))
          )}
        </div>
      ) : null}
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
    normalized === "approved"
    || normalized === "applied"
    || normalized === "clear"
    || normalized === "not_required"
      ? "success"
      : normalized === "pending" || normalized === "pending_approval"
        ? "warning"
        : normalized === "issue"
          ? "danger"
          : normalized === "rejected"
            ? "neutral"
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
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ring-1 ring-inset",
        tone === "success"
          ? "bg-emerald-100 text-emerald-800 ring-emerald-200/80"
          : tone === "warning"
            ? "bg-amber-100 text-amber-800 ring-amber-200/80"
            : tone === "danger"
              ? "bg-rose-100 text-rose-800 ring-rose-200/80"
              : tone === "info"
                ? "bg-sky-100 text-sky-800 ring-sky-200/80"
                : "bg-slate-100 text-slate-700 ring-slate-200/90",
      )}
    >
      {label}
    </span>
  );
}

function buildLifecycleSteps(batch: PayrollBatchDetailRecord) {
  const normalizedStatus = batch.status.trim().toLowerCase();
  const currentIndex = ["draft", "calculated", "reviewed", "approved", "finalized", "payslip_released", "posted"].indexOf(normalizedStatus);
  const releaseTimestamp = batch.posted_at;

  return [
    { label: "Calculated", timestamp: batch.calculated_at, state: batch.calculated_at ? "Completed" : "Pending" },
    { label: "Reviewed", timestamp: batch.reviewed_at, state: batch.reviewed_at ? "Completed" : normalizedStatus === "calculated" ? "Next" : "Pending" },
    { label: "Approved", timestamp: batch.approved_at, state: batch.approved_at ? "Completed" : normalizedStatus === "reviewed" ? "Next" : "Pending" },
    { label: "Finalized", timestamp: batch.finalized_at, state: batch.finalized_at ? "Completed" : normalizedStatus === "approved" ? "Next" : "Pending" },
    { label: "Released", timestamp: releaseTimestamp, state: releaseTimestamp ? "Completed" : normalizedStatus === "finalized" ? "Next" : "Pending" },
  ].map((step, index) => ({
    ...step,
    completed: step.timestamp != null,
    current: !step.timestamp && index === Math.max(Math.min(currentIndex, 4), 0),
  }));
}

function getLifecycleMessage(status: string) {
  const normalizedStatus = status.trim().toLowerCase();

  if (normalizedStatus === "calculated") {
    return "Calculated payroll is still operational. Finance should review the batch before any approval action.";
  }
  if (normalizedStatus === "reviewed") {
    return "Finance review is complete. Admin-Finance approval is still required before payroll can be finalized.";
  }
  if (normalizedStatus === "approved") {
    return "Approved payroll is not yet official. Finalize the batch to lock payroll values before release.";
  }
  if (normalizedStatus === "finalized") {
    return "Payroll is finalized and protected from recalculation. Employees still cannot view payslips until release.";
  }
  if (normalizedStatus === "payslip_released" || normalizedStatus === "posted") {
    return "Payslips have been released. Employees can now access this payroll cutoff from the payslip module.";
  }
  return null;
}


function Card({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="ui-metric-card"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p><p className="mt-3 text-[1.1rem] font-semibold tracking-tight text-slate-950">{value}</p><p className="mt-2 text-[11px] text-slate-600">{detail}</p></div>;
}

function Banner({ children, tone }: { children: React.ReactNode; tone: "error" | "success" }) {
  return <div className={cn("ui-state-banner", tone === "error" ? "ui-state-banner-error" : "ui-state-banner-success")}>{children}</div>;
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
  return <th className="ui-table-head-cell">{children}</th>;
}

function Cell({ children }: { children: React.ReactNode }) {
  return <td className="ui-table-body-cell">{children}</td>;
}

function Mini({ label, value, active }: { label: string; value: string; active: boolean }) {
  return <div><p className={cn("text-[11px] font-semibold uppercase tracking-[0.16em]", active ? "text-sky-700" : "text-slate-500")}>{label}</p><p className={cn("mt-1", active ? "text-slate-950" : "text-slate-900")}>{value}</p></div>;
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

function buildAttendanceBreakdownRow({
  id,
  label,
  amount,
  note,
  lineItems,
}: {
  id: string;
  label: string;
  amount: string;
  note: string;
  lineItems: PayrollAttendanceLineItemRecord[];
}): BreakdownRow {
  return {
    id,
    label,
    amount,
    note,
    details: lineItems.length > 0 ? lineItems.map(buildAttendanceBreakdownDetail) : undefined,
  };
}

function buildAttendanceBreakdownDetail(
  item: PayrollAttendanceLineItemRecord,
): BreakdownRowDetail {
  const fields = [
    { label: "Date", value: formatDate(item.attendance_date) },
    { label: "Day type", value: formatAttendanceDayType(item) },
    { label: "Time in", value: formatAttendanceClockTime(item.time_in) },
    {
      label: "Time out",
      value: formatAttendanceClockTime(item.time_out, item.time_out_day_offset),
    },
    { label: "Shift", value: formatShiftWindow(item.shift_start, item.shift_end) },
    ...(item.rendered_minutes > 0
      ? [{ label: "Rendered", value: formatMinutesDuration(item.rendered_minutes) }]
      : []),
    ...(item.payroll_minutes > 0
      ? [{ label: "Payroll basis", value: formatMinutesDuration(item.payroll_minutes) }]
      : []),
    ...(item.late_minutes > 0
      ? [{ label: "Late", value: formatMinutesDuration(item.late_minutes) }]
      : []),
    ...(item.undertime_minutes > 0
      ? [{ label: "Undertime", value: formatMinutesDuration(item.undertime_minutes) }]
      : []),
    ...(item.overtime_minutes > 0
      ? [{ label: "Overtime", value: formatMinutesDuration(item.overtime_minutes) }]
      : []),
    ...(item.night_differential_minutes > 0
      ? [
          {
            label: "Night differential",
            value: formatMinutesDuration(item.night_differential_minutes),
          },
        ]
      : []),
    ...(item.source_reference
      ? [{ label: "Source", value: item.source_reference }]
      : []),
    ...(item.approval_basis
      ? [{ label: "Approval basis", value: item.approval_basis }]
      : []),
  ];

  return {
    id: `${item.category}-${item.attendance_record_id ?? item.attendance_date}`,
    title: `${formatDate(item.attendance_date)}${item.is_rest_day ? " • Rest day" : ""}`,
    amount: item.amount,
    fields,
  };
}

function formatAttendanceDayType(item: PayrollAttendanceLineItemRecord) {
  if (item.is_rest_day) {
    return "Rest day";
  }

  return pretty(item.day_type);
}

function formatAttendanceClockTime(
  value: string | null | undefined,
  dayOffset = 0,
) {
  if (!value) {
    return "Missing";
  }

  const [hoursText, minutesText] = value.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return value;
  }

  const normalizedHours = ((hours % 24) + 24) % 24;
  const suffix = normalizedHours >= 12 ? "PM" : "AM";
  const displayHours = normalizedHours % 12 || 12;
  const baseValue = `${displayHours}:${String(minutes).padStart(2, "0")} ${suffix}`;

  if (dayOffset === 0) {
    return baseValue;
  }

  return `${baseValue} (+${dayOffset} day${dayOffset === 1 ? "" : "s"})`;
}

function formatShiftWindow(
  shiftStart: string | null | undefined,
  shiftEnd: string | null | undefined,
) {
  if (!shiftStart || !shiftEnd) {
    return "No shift schedule";
  }

  return `${formatAttendanceClockTime(shiftStart)} to ${formatAttendanceClockTime(shiftEnd)}`;
}

function formatMinutesDuration(minutes: number) {
  if (minutes <= 0) {
    return "0 min";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) {
    return `${minutes} min`;
  }
  if (remainingMinutes === 0) {
    return `${hours} hr${hours === 1 ? "" : "s"}`;
  }
  return `${hours} hr${hours === 1 ? "" : "s"} ${remainingMinutes} min`;
}

function sumAmountStrings(amounts: string[]) {
  const totalCents = amounts.reduce(
    (currentValue, amount) => currentValue + Math.round(Number(amount || "0") * 100),
    0,
  );
  return (totalCents / 100).toFixed(2);
}

function filterRowsWithAmounts(rows: BreakdownRow[]) {
  return rows.filter((row) => Math.abs(Number(row.amount || "0")) > 0);
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

function getEmployeeActionKey(
  action: "calculate" | "recalculate",
  statusRecord: EmployeePayrollCutoffStatusRecord,
) {
  return `${action}:${statusRecord.cutoff_id}:${statusRecord.employee_id}`;
}
