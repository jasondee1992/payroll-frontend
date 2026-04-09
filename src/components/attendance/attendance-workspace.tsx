"use client";

import Link from "next/link";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AttendanceDashboardTabs } from "@/components/attendance/attendance-dashboard-tabs";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import {
  ResourceEmptyState,
  ResourceErrorState,
  ResourceTableSkeleton,
} from "@/components/shared/resource-state";
import {
  acknowledgeAttendanceReview,
  approveAttendanceReviewRequest,
  cancelAttendanceReviewRequest,
  createAttendanceCutoff,
  createAttendanceReviewRequest,
  createAttendanceTeamReviewRequest,
  getAttendanceEmployeeRecords,
  getAttendanceCutoffSummary,
  getAttendanceCutoffs,
  getAttendanceReviewRequests,
  getMyAttendanceReview,
  lockAttendanceCutoff,
  rejectAttendanceReviewRequest,
  unlockAttendanceCutoff,
  uploadAttendanceCsv,
  type CreateAttendanceReviewRequestPayload,
} from "@/lib/api/attendance";
import { formatDate, formatTime, formatWeekday } from "@/lib/format";
import { formatPhilippineDateTime } from "@/lib/format/philippine-time";
import {
  canDeleteAttendanceCutoffs,
  canManageAttendanceUploads,
  canManageTeamAttendance,
  canUnlockAttendanceCutoffs,
  type AppRole,
} from "@/lib/auth/session";
import { preserveCurrentValue } from "@/lib/preserved-collection-state";
import { usePreservedScroll } from "@/lib/use-preserved-scroll";
import type {
  AttendanceRecord,
  AttendanceCutoffRecord,
  AttendanceCutoffSummaryRecord,
  AttendanceImportSummaryRecord,
  AttendanceMyReviewRecord,
  AttendanceReviewRequestRecord,
} from "@/types/attendance";
import { cn } from "@/lib/utils";

type AttendanceWorkspaceProps = {
  currentRole: AppRole | null;
  currentUsername: string | null;
};

type RequestDraftState = {
  employee_id: string;
  attendance_record_id: string;
  attendance_date: string;
  request_type: AttendanceReviewRequestRecord["request_type"];
  requested_time_in: string;
  requested_time_out: string;
  requested_overtime_minutes: string;
  requested_undertime_reason: string;
  reason: string;
  remarks: string;
};

const DEFAULT_REQUEST_DRAFT: RequestDraftState = {
  employee_id: "",
  attendance_record_id: "",
  attendance_date: "",
  request_type: "attendance-correction",
  requested_time_in: "",
  requested_time_out: "",
  requested_overtime_minutes: "",
  requested_undertime_reason: "",
  reason: "",
  remarks: "",
};

const ATTENDANCE_REQUEST_TYPE_OPTIONS = [
  { value: "attendance-correction", label: "Attendance Correction / Dispute" },
  { value: "missing-time-in", label: "Missing Time In" },
  { value: "missing-time-out", label: "Missing Time Out" },
  { value: "overtime", label: "Overtime Request" },
  { value: "undertime-explanation", label: "Undertime Explanation" },
] as const;

export function AttendanceWorkspace({
  currentRole,
  currentUsername,
}: AttendanceWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { captureScrollPosition, restoreScrollPosition } = usePreservedScroll();
  const [cutoffs, setCutoffs] = useState<AttendanceCutoffRecord[]>([]);
  const [selectedCutoffId, setSelectedCutoffId] = useState<number | null>(null);
  const [teamSummary, setTeamSummary] = useState<AttendanceCutoffSummaryRecord | null>(null);
  const [myReview, setMyReview] = useState<AttendanceMyReviewRecord | null>(null);
  const [requests, setRequests] = useState<AttendanceReviewRequestRecord[]>([]);
  const [importSummary, setImportSummary] = useState<AttendanceImportSummaryRecord | null>(null);
  const [createCutoffStart, setCreateCutoffStart] = useState("");
  const [createCutoffEnd, setCreateCutoffEnd] = useState("");
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [requestDraft, setRequestDraft] = useState<RequestDraftState>(DEFAULT_REQUEST_DRAFT);
  const [teamRequestDraft, setTeamRequestDraft] = useState<RequestDraftState>(DEFAULT_REQUEST_DRAFT);
  const [teamEmployeeRecords, setTeamEmployeeRecords] = useState<AttendanceRecord[]>([]);
  const [requestFilterStatus, setRequestFilterStatus] = useState("");
  const [requestFilterEmployee, setRequestFilterEmployee] = useState("");
  const [reviewRemarks, setReviewRemarks] = useState<Record<number, string>>({});
  const [loadingCutoffs, setLoadingCutoffs] = useState(true);
  const [loadingTeamSummary, setLoadingTeamSummary] = useState(false);
  const [loadingTeamEmployeeRecords, setLoadingTeamEmployeeRecords] = useState(false);
  const [loadingMyReview, setLoadingMyReview] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [uploadingAttendance, setUploadingAttendance] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [lockingCutoff, setLockingCutoff] = useState(false);
  const [acknowledgingReview, setAcknowledgingReview] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const activeTabFromUrl = searchParams.get("tab");
  const initialTabId =
    activeTabFromUrl === "my-attendance" || activeTabFromUrl === "team-attendance"
      ? activeTabFromUrl
      : currentRole === "employee"
        ? "my-attendance"
        : "team-attendance";
  const highlightedRequestId = Number(searchParams.get("requestId") ?? "");
  const hasHighlightedRequest = Number.isFinite(highlightedRequestId) && highlightedRequestId > 0;
  const canReviewTeamAttendance = canManageTeamAttendance(currentRole);
  const canManageAttendanceImports = canManageAttendanceUploads(currentRole);
  const canUnlockCutoffs = canUnlockAttendanceCutoffs(currentRole);
  const canManageUploadedCutoffDeletes = canDeleteAttendanceCutoffs(currentRole);
  const matchingCutoff = cutoffs.find(
    (cutoff) =>
      cutoff.cutoff_start === createCutoffStart && cutoff.cutoff_end === createCutoffEnd,
  );

  function buildRequestDraftDefaults(records: AttendanceRecord[], employeeId?: number | null) {
    return {
      ...DEFAULT_REQUEST_DRAFT,
      employee_id: employeeId != null ? String(employeeId) : "",
      attendance_record_id: String(records[0]?.id ?? ""),
      attendance_date: records[0]?.attendance_date ?? "",
    };
  }

  function buildAttendanceRequestPayload(
    draft: RequestDraftState,
    cutoffId: number,
  ): CreateAttendanceReviewRequestPayload {
    return {
      cutoff_id: cutoffId,
      employee_id: draft.employee_id ? Number(draft.employee_id) : null,
      attendance_record_id: draft.attendance_record_id
        ? Number(draft.attendance_record_id)
        : null,
      attendance_date: draft.attendance_date || null,
      request_type: draft.request_type,
      requested_time_in: draft.requested_time_in || null,
      requested_time_out: draft.requested_time_out || null,
      requested_overtime_minutes: draft.requested_overtime_minutes
        ? Number(draft.requested_overtime_minutes)
        : null,
      requested_undertime_reason: draft.requested_undertime_reason || null,
      reason: draft.reason,
      remarks: draft.remarks || null,
    };
  }

  async function refreshCutoffContext(activeCutoffId: number) {
    const [nextTeamSummary, nextRequests, nextMyReview] = await Promise.all([
      canReviewTeamAttendance
        ? getAttendanceCutoffSummary(activeCutoffId)
        : Promise.resolve(null),
      canReviewTeamAttendance
        ? getAttendanceReviewRequests({
            cutoffId: activeCutoffId,
            status: requestFilterStatus || null,
            employee: requestFilterEmployee || null,
          })
        : Promise.resolve([]),
      getMyAttendanceReview(activeCutoffId).catch(() => null),
    ]);

    if (nextTeamSummary) {
      setTeamSummary(nextTeamSummary);
    }
    if (canReviewTeamAttendance) {
      setRequests(nextRequests);
    }
    setMyReview(nextMyReview);
    return { nextTeamSummary, nextMyReview };
  }

  useEffect(() => {
    let isCancelled = false;

    async function loadCutoffs() {
      setLoadingCutoffs(true);
      setPageError(null);

      try {
        const cutoffRecords = await getAttendanceCutoffs();
        if (isCancelled) {
          return;
        }

        setCutoffs(cutoffRecords);
        const cutoffIdFromUrl = Number(searchParams.get("cutoffId") ?? "");
        const requestedCutoffId =
          Number.isFinite(cutoffIdFromUrl) && cutoffIdFromUrl > 0
            ? cutoffIdFromUrl
            : selectedCutoffId;
        const nextCutoffId = preserveCurrentValue(
          cutoffRecords.map((item) => item.id),
          requestedCutoffId,
        );
        setSelectedCutoffId(nextCutoffId);
      } catch (error) {
        if (!isCancelled) {
          setPageError(
            error instanceof Error
              ? error.message
              : "Unable to load attendance cutoffs.",
          );
        }
      } finally {
        if (!isCancelled) {
          setLoadingCutoffs(false);
        }
      }
    }

    void loadCutoffs();

    return () => {
      isCancelled = true;
    };
  }, [searchParams, selectedCutoffId]);

  useEffect(() => {
    if (selectedCutoffId == null) {
      setTeamSummary(null);
      setMyReview(null);
      setRequests([]);
      return;
    }

    let isCancelled = false;
    const activeCutoffId = selectedCutoffId;

    async function loadSelectedCutoffData() {
      setInlineError(null);
      setSuccessMessage(null);

      if (canReviewTeamAttendance) {
        setLoadingTeamSummary(true);
        setLoadingRequests(true);
        try {
          const [summaryResult, requestsResult] = await Promise.all([
            getAttendanceCutoffSummary(activeCutoffId),
            getAttendanceReviewRequests({
              cutoffId: activeCutoffId,
              status: requestFilterStatus || null,
              employee: requestFilterEmployee || null,
            }),
        ]);
        if (!isCancelled) {
          setTeamSummary(summaryResult);
          setRequests(requestsResult);
          setTeamRequestDraft((current) => {
            const nextEmployeeId = preserveCurrentValue(
              summaryResult.employees.map((item) => item.employee_id),
              current.employee_id ? Number(current.employee_id) : null,
            );
            return {
              ...current,
              employee_id: nextEmployeeId != null ? String(nextEmployeeId) : "",
            };
          });
        }
        } catch (error) {
          if (!isCancelled) {
            setInlineError(
              error instanceof Error
                ? error.message
                : "Unable to load attendance review data.",
            );
          }
        } finally {
          if (!isCancelled) {
            setLoadingTeamSummary(false);
            setLoadingRequests(false);
          }
        }
      }

      setLoadingMyReview(true);
      try {
        const reviewResult = await getMyAttendanceReview(activeCutoffId);
        if (!isCancelled) {
          setMyReview(reviewResult);
          setRequestDraft((current) => ({
            ...buildRequestDraftDefaults(reviewResult.records),
            ...current,
            attendance_record_id:
              current.attendance_record_id || String(reviewResult.records[0]?.id ?? ""),
            attendance_date:
              current.attendance_date || reviewResult.records[0]?.attendance_date || "",
          }));
        }
      } catch {
        if (!isCancelled) {
          setMyReview(null);
        }
      } finally {
        if (!isCancelled) {
          setLoadingMyReview(false);
        }
      }
    }

    void loadSelectedCutoffData();

    return () => {
      isCancelled = true;
    };
  }, [
    canReviewTeamAttendance,
    requestFilterEmployee,
    requestFilterStatus,
    selectedCutoffId,
  ]);

  useEffect(() => {
    if (!canReviewTeamAttendance || selectedCutoffId == null || !teamRequestDraft.employee_id) {
      setTeamEmployeeRecords([]);
      return;
    }

    let isCancelled = false;
    const activeCutoffId = selectedCutoffId;
    const employeeId = Number(teamRequestDraft.employee_id);
    if (!Number.isFinite(employeeId) || employeeId <= 0) {
      setTeamEmployeeRecords([]);
      return;
    }

    async function loadTeamEmployeeRecords() {
      setLoadingTeamEmployeeRecords(true);
      try {
        const records = await getAttendanceEmployeeRecords(activeCutoffId, employeeId);
        if (isCancelled) {
          return;
        }
        setTeamEmployeeRecords(records);
        setTeamRequestDraft((current) => ({
          ...buildRequestDraftDefaults(records, employeeId),
          ...current,
          employee_id: String(employeeId),
          attendance_record_id:
            current.attendance_record_id || String(records[0]?.id ?? ""),
          attendance_date:
            current.attendance_date || records[0]?.attendance_date || "",
        }));
      } catch (error) {
        if (!isCancelled) {
          setInlineError(
            error instanceof Error
              ? error.message
              : "Unable to load employee attendance records.",
          );
        }
      } finally {
        if (!isCancelled) {
          setLoadingTeamEmployeeRecords(false);
        }
      }
    }

    void loadTeamEmployeeRecords();

    return () => {
      isCancelled = true;
    };
  }, [canReviewTeamAttendance, selectedCutoffId, teamRequestDraft.employee_id]);

  function updateSearchParams(nextTabId: string, nextCutoffId?: number | null) {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("tab", nextTabId);

    if (nextCutoffId != null) {
      nextParams.set("cutoffId", String(nextCutoffId));
    }

    router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
  }

  function handleSelectCutoff(nextCutoffId: number) {
    setSelectedCutoffId(nextCutoffId);
    updateSearchParams(initialTabId, nextCutoffId);
  }

  async function preserveContextDuring(action: () => Promise<void>) {
    const scrollPosition = captureScrollPosition();

    try {
      await action();
    } finally {
      restoreScrollPosition(scrollPosition);
    }
  }

  async function handleUploadAttendance() {
    if (!canManageAttendanceImports) {
      setInlineError(
        "Only Admin-Finance, Finance, and HR users can upload attendance CSV files.",
      );
      return;
    }

    if (!createCutoffStart || !createCutoffEnd) {
      setInlineError("Select both cutoff start and cutoff end dates before uploading.");
      return;
    }

    if (createCutoffEnd < createCutoffStart) {
      setInlineError("Cutoff end date must be on or after the cutoff start date.");
      return;
    }

    if (!selectedUploadFile) {
      setInlineError("Choose a CSV file before uploading.");
      return;
    }

    await preserveContextDuring(async () => {
      setUploadingAttendance(true);
      setInlineError(null);
      setSuccessMessage(null);
      let activeCutoffId: number | null = null;

      try {
        const existingCutoff = cutoffs.find(
          (cutoff) =>
            cutoff.cutoff_start === createCutoffStart && cutoff.cutoff_end === createCutoffEnd,
        );
        const cutoff =
          existingCutoff ??
          (await createAttendanceCutoff({
            cutoff_start: createCutoffStart,
            cutoff_end: createCutoffEnd,
          }));

        activeCutoffId = cutoff.id;
        const summary = await uploadAttendanceCsv(activeCutoffId, selectedUploadFile);
        setImportSummary(summary);
        setSelectedCutoffId(activeCutoffId);
        setSelectedUploadFile(null);
        setCreateCutoffStart("");
        setCreateCutoffEnd("");
        setCutoffs((current) =>
          current.some((item) => item.id === cutoff.id) ? current : [cutoff, ...current],
        );
        updateSearchParams("team-attendance", activeCutoffId);
        setSuccessMessage(
          existingCutoff
            ? "Attendance replaced for the selected cutoff and processed."
            : "Attendance CSV uploaded and processed.",
        );
        const [nextSummary, nextMyReview, nextRequests, nextCutoffs] = await Promise.all([
          getAttendanceCutoffSummary(activeCutoffId),
          getMyAttendanceReview(activeCutoffId).catch(() => null),
          getAttendanceReviewRequests({
            cutoffId: activeCutoffId,
            status: requestFilterStatus || null,
            employee: requestFilterEmployee || null,
          }),
          getAttendanceCutoffs(),
        ]);
        setTeamSummary(nextSummary);
        setRequests(nextRequests);
        setMyReview(nextMyReview);
        setCutoffs(nextCutoffs);
      } catch (error) {
        if (activeCutoffId != null) {
          setSelectedCutoffId(activeCutoffId);
          void getAttendanceCutoffs().then(setCutoffs).catch(() => undefined);
        }
        setInlineError(
          error instanceof Error ? error.message : "Unable to upload attendance CSV.",
        );
      } finally {
        setUploadingAttendance(false);
      }
    });
  }

  async function handleAcknowledgeReview() {
    if (selectedCutoffId == null) {
      return;
    }

    await preserveContextDuring(async () => {
      setAcknowledgingReview(true);
      setInlineError(null);
      setSuccessMessage(null);
      const activeCutoffId = selectedCutoffId;

      try {
        const reviewResult = await acknowledgeAttendanceReview(activeCutoffId);
        setMyReview(reviewResult);
        if (canReviewTeamAttendance) {
          setTeamSummary(await getAttendanceCutoffSummary(activeCutoffId));
        }
        setSuccessMessage("Attendance review acknowledged.");
      } catch (error) {
        setInlineError(
          error instanceof Error ? error.message : "Unable to acknowledge attendance review.",
        );
      } finally {
        setAcknowledgingReview(false);
      }
    });
  }

  async function handleSubmitAttendanceRequest() {
    if (selectedCutoffId == null) {
      return;
    }

    await preserveContextDuring(async () => {
      setSubmittingRequest(true);
      setInlineError(null);
      setSuccessMessage(null);
      const activeCutoffId = selectedCutoffId;

      try {
        await createAttendanceReviewRequest(
          buildAttendanceRequestPayload(requestDraft, activeCutoffId),
        );
        const { nextMyReview } = await refreshCutoffContext(activeCutoffId);
        if (nextMyReview) {
          setRequestDraft(buildRequestDraftDefaults(nextMyReview.records));
        }
        setSuccessMessage("Attendance correction request submitted.");
      } catch (error) {
        setInlineError(
          error instanceof Error ? error.message : "Unable to submit attendance request.",
        );
      } finally {
        setSubmittingRequest(false);
      }
    });
  }

  async function handleSubmitTeamAttendanceRequest() {
    if (selectedCutoffId == null) {
      return;
    }

    await preserveContextDuring(async () => {
      setSubmittingRequest(true);
      setInlineError(null);
      setSuccessMessage(null);
      const activeCutoffId = selectedCutoffId;

      try {
        await createAttendanceTeamReviewRequest(
          buildAttendanceRequestPayload(teamRequestDraft, activeCutoffId),
        );
        await refreshCutoffContext(activeCutoffId);
        setTeamRequestDraft(
          buildRequestDraftDefaults(
            teamEmployeeRecords,
            teamRequestDraft.employee_id ? Number(teamRequestDraft.employee_id) : null,
          ),
        );
        setSuccessMessage("Attendance correction request logged for review.");
      } catch (error) {
        setInlineError(
          error instanceof Error ? error.message : "Unable to submit attendance correction.",
        );
      } finally {
        setSubmittingRequest(false);
      }
    });
  }

  async function handleReviewRequest(requestId: number, action: "approve" | "reject") {
    await preserveContextDuring(async () => {
      setInlineError(null);
      setSuccessMessage(null);

      try {
        if (action === "approve") {
          await approveAttendanceReviewRequest(requestId, {
            remarks: reviewRemarks[requestId] ?? null,
          });
        } else {
          await rejectAttendanceReviewRequest(requestId, {
            remarks: reviewRemarks[requestId] ?? null,
          });
        }

        if (selectedCutoffId != null) {
          await refreshCutoffContext(selectedCutoffId);
        }

        setSuccessMessage(
          action === "approve"
            ? "Attendance request approved."
            : "Attendance request rejected.",
        );
      } catch (error) {
        setInlineError(
          error instanceof Error ? error.message : "Unable to review attendance request.",
        );
      }
    });
  }

  async function handleCancelRequest(requestId: number) {
    await preserveContextDuring(async () => {
      setInlineError(null);
      setSuccessMessage(null);

      try {
        await cancelAttendanceReviewRequest(requestId, {
          remarks: reviewRemarks[requestId] ?? null,
        });

        if (selectedCutoffId != null) {
          await refreshCutoffContext(selectedCutoffId);
        }

        setSuccessMessage("Attendance request cancelled.");
      } catch (error) {
        setInlineError(
          error instanceof Error ? error.message : "Unable to cancel the attendance request.",
        );
      }
    });
  }

  async function handleLockCutoff() {
    if (!canManageAttendanceImports) {
      setInlineError(
        "Only Admin-Finance, Finance, and HR users can lock attendance cutoffs.",
      );
      return;
    }

    if (selectedCutoffId == null) {
      return;
    }

    await preserveContextDuring(async () => {
      setLockingCutoff(true);
      setInlineError(null);
      setSuccessMessage(null);
      const activeCutoffId = selectedCutoffId;

      try {
        await lockAttendanceCutoff(activeCutoffId);
        const [nextCutoffs, nextSummary, nextMyReview] = await Promise.all([
          getAttendanceCutoffs(),
          getAttendanceCutoffSummary(activeCutoffId),
          getMyAttendanceReview(activeCutoffId).catch(() => null),
        ]);
        setCutoffs(nextCutoffs);
        setTeamSummary(nextSummary);
        setMyReview(nextMyReview);
        setSuccessMessage("Attendance cutoff locked and marked payroll-ready.");
      } catch (error) {
        setInlineError(
          error instanceof Error ? error.message : "Unable to lock the attendance cutoff.",
        );
      } finally {
        setLockingCutoff(false);
      }
    });
  }

  async function handleUnlockCutoff() {
    if (!canUnlockCutoffs) {
      setInlineError(
        "Only Admin-Finance and Finance users can unlock attendance cutoffs.",
      );
      return;
    }

    if (selectedCutoffId == null) {
      return;
    }

    await preserveContextDuring(async () => {
      setLockingCutoff(true);
      setInlineError(null);
      setSuccessMessage(null);
      const activeCutoffId = selectedCutoffId;

      try {
        await unlockAttendanceCutoff(activeCutoffId);
        const [nextCutoffs, nextSummary, nextMyReview] = await Promise.all([
          getAttendanceCutoffs(),
          getAttendanceCutoffSummary(activeCutoffId),
          getMyAttendanceReview(activeCutoffId).catch(() => null),
        ]);
        setCutoffs(nextCutoffs);
        setTeamSummary(nextSummary);
        setMyReview(nextMyReview);
        setSuccessMessage("Attendance cutoff unlocked and reopened for attendance updates.");
      } catch (error) {
        setInlineError(getAttendanceUnlockErrorMessage(error));
      } finally {
        setLockingCutoff(false);
      }
    });
  }

  if (loadingCutoffs) {
    return <ResourceTableSkeleton rowCount={5} />;
  }

  if (pageError) {
    return (
      <ResourceErrorState
        title="Unable to load attendance workspace"
        description={pageError}
      />
    );
  }

  if (cutoffs.length === 0 && !canManageAttendanceImports) {
    return (
      <ResourceEmptyState
        title="No attendance cutoffs yet"
        description={
          canReviewTeamAttendance
            ? "Attendance cutoffs will appear here once Admin-Finance, Finance, or HR creates one for review."
            : "Attendance cutoffs will appear here once Admin-Finance, Finance, or HR uploads attendance for your payroll period."
        }
      />
    );
  }

  const selectedCutoff =
    cutoffs.find((cutoff) => cutoff.id === selectedCutoffId) ?? cutoffs[0];

  const myAttendanceContent = (
    <AttendanceReviewPanel
      currentUsername={currentUsername}
      cutoffs={cutoffs}
      selectedCutoffId={selectedCutoff?.id ?? null}
      onSelectCutoff={handleSelectCutoff}
      loading={loadingMyReview}
      review={myReview}
      requestDraft={requestDraft}
      onRequestDraftChange={setRequestDraft}
      onSubmitRequest={handleSubmitAttendanceRequest}
      onAcknowledge={handleAcknowledgeReview}
      reviewRemarks={reviewRemarks}
      onReviewRemarksChange={setReviewRemarks}
      onCancelRequest={handleCancelRequest}
      submittingRequest={submittingRequest}
      acknowledgingReview={acknowledgingReview}
      highlightedRequestId={hasHighlightedRequest ? highlightedRequestId : null}
    />
  );

  if (!canReviewTeamAttendance) {
    return myAttendanceContent;
  }

  return (
    <div className="space-y-4">
      {canManageUploadedCutoffDeletes ? (
        <div className="ui-state-banner ui-state-banner-info">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Wrong cutoff upload?</p>
              <p className="mt-1 text-sky-800">
                Delete saved attendance cutoff uploads from the Admin-Finance settings screen, then re-upload the corrected file.
              </p>
            </div>

            <Link href="/settings" className="ui-button-secondary">
              Open cutoff manager
            </Link>
          </div>
        </div>
      ) : null}

      {inlineError ? (
        <div className="ui-state-banner ui-state-banner-error">
          {inlineError}
        </div>
      ) : null}
      {successMessage ? (
        <div className="ui-state-banner ui-state-banner-success">
          {successMessage}
        </div>
      ) : null}

      <AttendanceDashboardTabs
        initialTabId={initialTabId}
        onTabChange={(tabId) => updateSearchParams(tabId, selectedCutoff?.id ?? null)}
        tabs={[
          {
            id: "team-attendance",
            label: "Team Attendance",
            content: (
              <TeamAttendancePanel
                cutoffs={cutoffs}
                selectedCutoffId={selectedCutoff?.id ?? null}
                onSelectCutoff={handleSelectCutoff}
                createCutoffStart={createCutoffStart}
                createCutoffEnd={createCutoffEnd}
                onCreateCutoffStartChange={setCreateCutoffStart}
                onCreateCutoffEndChange={setCreateCutoffEnd}
                canManageAttendanceImports={canManageAttendanceImports}
                isReplacingAttendance={matchingCutoff != null}
                selectedUploadFile={selectedUploadFile}
                onUploadFileChange={setSelectedUploadFile}
                onUploadAttendance={handleUploadAttendance}
                uploadingAttendance={uploadingAttendance}
                importSummary={importSummary}
                summary={teamSummary}
                loadingSummary={loadingTeamSummary}
                requests={requests}
                loadingRequests={loadingRequests}
                requestDraft={teamRequestDraft}
                onRequestDraftChange={setTeamRequestDraft}
                teamEmployeeRecords={teamEmployeeRecords}
                loadingTeamEmployeeRecords={loadingTeamEmployeeRecords}
                onSubmitRequest={handleSubmitTeamAttendanceRequest}
                onCancelRequest={handleCancelRequest}
                requestFilterStatus={requestFilterStatus}
                requestFilterEmployee={requestFilterEmployee}
                onRequestFilterStatusChange={setRequestFilterStatus}
                onRequestFilterEmployeeChange={setRequestFilterEmployee}
                reviewRemarks={reviewRemarks}
                onReviewRemarksChange={setReviewRemarks}
                onReviewRequest={handleReviewRequest}
                onLockCutoff={handleLockCutoff}
                onUnlockCutoff={handleUnlockCutoff}
                lockingCutoff={lockingCutoff}
                canUnlockCutoffs={canUnlockCutoffs}
                highlightedRequestId={hasHighlightedRequest ? highlightedRequestId : null}
              />
            ),
          },
          {
            id: "my-attendance",
            label: "My Attendance",
            content: myAttendanceContent,
          },
        ]}
      />
    </div>
  );
}

function getAttendanceUnlockErrorMessage(error: unknown) {
  const fallbackMessage = "Unable to unlock the attendance cutoff.";
  const message = error instanceof Error ? error.message : fallbackMessage;

  if (message.includes("employee payroll has already been calculated")) {
    return "This cutoff already has payroll calculations. Open /payroll and unlock or discard the affected employee payroll entries before unlocking this attendance cutoff.";
  }

  if (message.includes("cannot be unlocked after payroll is posted")) {
    return "This cutoff is already part of a locked or posted payroll batch and can no longer be unlocked from Attendance.";
  }

  if (message.includes("Only locked attendance cutoffs can be unlocked")) {
    return "This cutoff is no longer locked. Refresh Attendance to load the latest cutoff status.";
  }

  return message;
}

function TeamAttendancePanel(props: {
  cutoffs: AttendanceCutoffRecord[];
  selectedCutoffId: number | null;
  onSelectCutoff: (cutoffId: number) => void;
  createCutoffStart: string;
  createCutoffEnd: string;
  onCreateCutoffStartChange: (value: string) => void;
  onCreateCutoffEndChange: (value: string) => void;
  canManageAttendanceImports: boolean;
  isReplacingAttendance: boolean;
  selectedUploadFile: File | null;
  onUploadFileChange: (file: File | null) => void;
  onUploadAttendance: () => void;
  uploadingAttendance: boolean;
  importSummary: AttendanceImportSummaryRecord | null;
  summary: AttendanceCutoffSummaryRecord | null;
  loadingSummary: boolean;
  requests: AttendanceReviewRequestRecord[];
  loadingRequests: boolean;
  requestDraft: RequestDraftState;
  onRequestDraftChange: Dispatch<SetStateAction<RequestDraftState>>;
  teamEmployeeRecords: AttendanceRecord[];
  loadingTeamEmployeeRecords: boolean;
  onSubmitRequest: () => void;
  onCancelRequest: (requestId: number) => void;
  requestFilterStatus: string;
  requestFilterEmployee: string;
  onRequestFilterStatusChange: (value: string) => void;
  onRequestFilterEmployeeChange: (value: string) => void;
  reviewRemarks: Record<number, string>;
  onReviewRemarksChange: Dispatch<SetStateAction<Record<number, string>>>;
  onReviewRequest: (requestId: number, action: "approve" | "reject") => void;
  onLockCutoff: () => void;
  onUnlockCutoff: () => void;
  lockingCutoff: boolean;
  canUnlockCutoffs: boolean;
  highlightedRequestId: number | null;
}) {
  const selectedCutoff =
    props.cutoffs.find((cutoff) => cutoff.id === props.selectedCutoffId) ?? props.cutoffs[0];

  return (
    <div className="space-y-4">
      {props.canManageAttendanceImports ? (
        <DashboardSection
          title="Upload attendance"
          description="Pick the cutoff dates, attach the CSV file, then save the attendance import to the API."
        >
          <div className="ui-detail-panel">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Cutoff Start">
                <input
                  type="date"
                  value={props.createCutoffStart}
                  onChange={(event) => props.onCreateCutoffStartChange(event.target.value)}
                  className="ui-select"
                />
              </Field>
              <Field label="Cutoff End">
                <input
                  type="date"
                  value={props.createCutoffEnd}
                  onChange={(event) => props.onCreateCutoffEndChange(event.target.value)}
                  className="ui-select"
                />
              </Field>
            </div>

            <div className="mt-4 space-y-3">
              <Field label="CSV File">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) =>
                    props.onUploadFileChange(event.target.files?.[0] ?? null)
                  }
                  className="block w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                />
              </Field>
              <p className="text-xs leading-5 text-slate-500">
                Supported headers include `employee_code` or `employee_id`, `attendance_date`,
                `time_in`, `time_out`, `remarks`, plus common export labels like `Employee ID`,
                `Date`, `Day`, `Time In`, and `Time Out`.
              </p>
              {props.isReplacingAttendance ? (
                <p className="text-xs leading-5 text-amber-700">
                  A cutoff already exists for this date range. Uploading again will replace the
                  current attendance rows for that cutoff period.
                </p>
              ) : null}
              <button
                type="button"
                onClick={props.onUploadAttendance}
                disabled={props.uploadingAttendance}
                className="ui-button-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {props.uploadingAttendance
                  ? "Saving upload..."
                  : props.isReplacingAttendance
                    ? "Replace attendance"
                    : "Upload attendance"}
              </button>
            </div>
          </div>
        </DashboardSection>
      ) : null}

      {props.importSummary ? (
        <DashboardSection
          title="Latest import summary"
          description="Quick validation and import results for the most recent attendance upload."
        >
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <MetricCard label="Total Rows" value={String(props.importSummary.total_rows)} />
            <MetricCard label="Valid Rows" value={String(props.importSummary.valid_rows)} />
            <MetricCard label="Invalid Rows" value={String(props.importSummary.invalid_rows)} />
            <MetricCard
              label="Employees Affected"
              value={String(props.importSummary.employees_affected)}
            />
            <MetricCard
              label="Missing Time In"
              value={String(props.importSummary.missing_time_in_rows)}
            />
            <MetricCard
              label="Missing Time Out"
              value={String(props.importSummary.missing_time_out_rows)}
            />
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <SimpleTable
              title="Preview rows"
              rows={props.importSummary.preview_rows.map((row) => [
                row.employee_code,
                formatDate(row.attendance_date),
                formatWeekday(row.attendance_date),
                formatTime(row.time_in ?? undefined),
                formatTime(row.time_out ?? undefined),
                row.status,
              ])}
              headers={["Employee", "Date", "Day", "Time In", "Time Out", "Status"]}
            />
            <SimpleTable
              title="Invalid rows"
              rows={props.importSummary.invalid_row_details.map((row) => [
                `Row ${row.row_number}`,
                row.employee_identifier ?? "--",
                row.message,
              ])}
              headers={["Row", "Employee", "Issue"]}
              emptyMessage="No invalid rows."
            />
          </div>
        </DashboardSection>
      ) : null}

      <DashboardSection
        title="Cutoff review dashboard"
        description="Track employee review progress, missing logs, and pending attendance requests before payroll locking."
        action={selectedCutoff ? <StatusPill status={selectedCutoff.status} /> : null}
      >
        {props.cutoffs.length > 0 ? (
          <div className="ui-toolbar mb-5 grid gap-3 md:grid-cols-[280px_minmax(0,1fr)]">
            <Field label="Review Cutoff">
              <select
                value={selectedCutoff?.id ?? ""}
                onChange={(event) => props.onSelectCutoff(Number(event.target.value))}
                className="ui-select"
              >
                {props.cutoffs.map((cutoff) => (
                  <option key={cutoff.id} value={cutoff.id}>
                    {formatDate(cutoff.cutoff_start)} to {formatDate(cutoff.cutoff_end)} •{" "}
                    {formatStatusLabel(cutoff.status)}
                  </option>
                ))}
              </select>
            </Field>
            <div className="ui-toolbar-muted text-sm text-slate-600">
              Select a cutoff to review uploaded attendance, employee summaries, and request approvals.
            </div>
          </div>
        ) : null}

        {props.loadingSummary ? (
          <ResourceTableSkeleton rowCount={4} />
        ) : props.summary ? (
          <>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <MetricCard label="Employees" value={String(props.summary.employee_count)} />
              <MetricCard
                label="Pending Review"
                value={String(props.summary.pending_review_count)}
              />
              <MetricCard label="Reviewed" value={String(props.summary.reviewed_count)} />
              <MetricCard
                label="Pending Requests"
                value={String(props.summary.pending_request_count)}
              />
              <MetricCard
                label="Missing Logs"
                value={String(props.summary.records_with_missing_logs)}
              />
            </div>

            <div className="ui-table-shell mt-5">
              <table className="min-w-full border-separate border-spacing-0 bg-white">
                <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Work Days</th>
                    <th className="px-4 py-3">Late</th>
                    <th className="px-4 py-3">Undertime</th>
                    <th className="px-4 py-3">Overtime</th>
                    <th className="px-4 py-3">Exceptions</th>
                    <th className="px-4 py-3">Review Status</th>
                  </tr>
                </thead>
                <tbody>
                  {props.summary.employees.map((employee) => (
                    <tr
                      key={`${employee.employee_id}-${employee.cutoff_id}`}
                      className="ui-table-row text-sm text-slate-700"
                    >
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-950">{employee.employee_name}</p>
                        <p className="mt-1 text-xs text-slate-500">{employee.employee_code}</p>
                      </td>
                      <td className="px-4 py-4">{employee.total_work_days}</td>
                      <td className="px-4 py-4">{employee.total_late_minutes}</td>
                      <td className="px-4 py-4">{employee.total_undertime_minutes}</td>
                      <td className="px-4 py-4">{employee.total_overtime_minutes}</td>
                      <td className="px-4 py-4">{employee.unresolved_exceptions_count}</td>
                      <td className="px-4 py-4">
                        <StatusPill status={employee.review_status} compact />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(props.summary.cutoff.status === "locked" || props.canManageAttendanceImports) ? (
              <div className="ui-action-bar ui-sticky-band mt-5 flex justify-end">
                {props.summary.cutoff.status === "locked" ? (
                  props.canUnlockCutoffs ? (
                    <button
                      type="button"
                      onClick={props.onUnlockCutoff}
                      disabled={props.lockingCutoff}
                      className="ui-button-secondary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {props.lockingCutoff ? "Unlocking cutoff..." : "Unlock cutoff"}
                    </button>
                  ) : null
                ) : props.canManageAttendanceImports ? (
                  <button
                    type="button"
                    onClick={props.onLockCutoff}
                    disabled={props.lockingCutoff}
                    className="ui-button-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {props.lockingCutoff ? "Locking cutoff..." : "Lock cutoff"}
                  </button>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <ResourceEmptyState
            title="No uploaded attendance yet"
            description={
              props.canManageAttendanceImports
                ? "Upload a CSV for the selected cutoff to generate employee summaries and review queues."
                : "Attendance summaries will appear here once Admin-Finance, Finance, or HR uploads the cutoff data."
            }
          />
        )}
      </DashboardSection>

      <DashboardSection
        title="Log attendance correction"
        description="Create a correction or dispute request for an employee before the cutoff is finalized for payroll."
      >
        {props.summary ? (
          <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
            <div className="space-y-4">
              <Field label="Employee">
                <select
                  value={props.requestDraft.employee_id}
                  onChange={(event) =>
                    props.onRequestDraftChange(() => ({
                      ...DEFAULT_REQUEST_DRAFT,
                      employee_id: event.target.value,
                    }))
                  }
                  className="ui-select"
                >
                  <option value="">Select employee</option>
                  {props.summary.employees.map((employee) => (
                    <option key={employee.employee_id} value={employee.employee_id}>
                      {employee.employee_name} • {employee.employee_code}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Attendance Record">
                <select
                  value={props.requestDraft.attendance_record_id}
                  onChange={(event) =>
                    props.onRequestDraftChange((current) => {
                      const nextRecord = props.teamEmployeeRecords.find(
                        (record) => String(record.id) === event.target.value,
                      );
                      return {
                        ...current,
                        attendance_record_id: event.target.value,
                        attendance_date: nextRecord?.attendance_date ?? current.attendance_date,
                      };
                    })
                  }
                  className="ui-select"
                  disabled={!props.requestDraft.employee_id || props.loadingTeamEmployeeRecords}
                >
                  <option value="">Date-only dispute / no imported record</option>
                  {props.teamEmployeeRecords.map((record) => (
                    <option key={record.id} value={record.id}>
                      {formatDate(record.attendance_date)} • {record.status} •{" "}
                      {formatTime(record.time_in ?? undefined)} / {formatTime(record.time_out ?? undefined)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Attendance Date">
                <input
                  type="date"
                  value={props.requestDraft.attendance_date}
                  onChange={(event) =>
                    props.onRequestDraftChange((current) => ({
                      ...current,
                      attendance_date: event.target.value,
                    }))
                  }
                  className="ui-select"
                />
              </Field>
            </div>

            <div className="space-y-4">
              <RequestDraftFields
                draft={props.requestDraft}
                onDraftChange={props.onRequestDraftChange}
              />
              <div className="ui-action-bar flex justify-end">
                <button
                  type="button"
                  onClick={props.onSubmitRequest}
                  disabled={!props.requestDraft.employee_id}
                  className="ui-button-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Submit correction request
                </button>
              </div>
            </div>
          </div>
        ) : (
          <ResourceEmptyState
            title="No cutoff selected yet"
            description="Select or upload a cutoff first, then log employee correction requests from this panel."
          />
        )}
      </DashboardSection>

      <DashboardSection
        title="Attendance requests for approval"
        description="Review employee attendance correction requests by cutoff, status, and employee."
      >
        <div className="ui-toolbar grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
          <select
            value={props.requestFilterStatus}
            onChange={(event) => props.onRequestFilterStatusChange(event.target.value)}
            className="ui-select"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input
            type="search"
            value={props.requestFilterEmployee}
            onChange={(event) => props.onRequestFilterEmployeeChange(event.target.value)}
            placeholder="Filter by employee code or name"
            className="ui-select"
          />
        </div>

        {props.loadingRequests ? (
          <ResourceTableSkeleton rowCount={4} className="mt-5" />
        ) : props.requests.length > 0 ? (
          <div className="mt-5 space-y-3">
            {props.requests.map((request) => (
              <article
                key={request.id}
                className={cn(
                  "rounded-[24px] border border-slate-200/80 bg-linear-to-r from-white via-slate-50/85 to-slate-50/65 p-4 shadow-sm",
                  props.highlightedRequestId === request.id &&
                    "border-sky-300 ring-2 ring-sky-200 shadow-[inset_4px_0_0_0_rgba(2,132,199,0.7)]",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {request.employee_name_snapshot}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                      {request.employee_code_snapshot} • {formatDate(request.attendance_date_snapshot)}
                    </p>
                  </div>
                  <StatusPill status={request.status} compact />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <MetaItem label="Request Type" value={formatRequestTypeLabel(request.request_type)} />
                  <MetaItem label="Original" value={formatRequestTimelineValue(request, "original")} />
                  <MetaItem label="Requested" value={formatRequestTimelineValue(request, "requested")} />
                  <MetaItem
                    label="Resolution"
                    value={request.applied_at ? `Applied ${formatPhilippineDateTime(request.applied_at)}` : "Pending application"}
                  />
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">{request.reason}</p>
                {request.remarks ? (
                  <p className="mt-2 text-sm leading-6 text-slate-500">Notes: {request.remarks}</p>
                ) : null}

                {request.status === "pending" ? (
                  <div className="ui-action-bar mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                    <input
                      type="text"
                      value={props.reviewRemarks[request.id] ?? ""}
                      onChange={(event) =>
                        props.onReviewRemarksChange((current) => ({
                          ...current,
                          [request.id]: event.target.value,
                        }))
                      }
                      placeholder="Optional review remarks"
                      className="ui-select"
                    />
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => props.onReviewRequest(request.id, "approve")}
                        className="ui-button-primary"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => props.onReviewRequest(request.id, "reject")}
                        className="ui-button-secondary"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => props.onCancelRequest(request.id)}
                        className="ui-button-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-xs uppercase tracking-[0.16em] text-slate-500">
                    {request.reviewed_by_name
                      ? `Reviewed by ${request.reviewed_by_name}`
                      : "Reviewed"}
                    {request.reviewed_at
                      ? ` • ${formatPhilippineDateTime(request.reviewed_at)}`
                      : ""}
                  </p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <ResourceEmptyState
            title="No attendance requests found"
            description="Pending corrections and disputes for this cutoff will appear here."
            className="mt-5"
          />
        )}
      </DashboardSection>
    </div>
  );
}

function AttendanceReviewPanel(props: {
  currentUsername: string | null;
  cutoffs: AttendanceCutoffRecord[];
  selectedCutoffId: number | null;
  onSelectCutoff: (cutoffId: number) => void;
  loading: boolean;
  review: AttendanceMyReviewRecord | null;
  requestDraft: RequestDraftState;
  onRequestDraftChange: Dispatch<SetStateAction<RequestDraftState>>;
  onSubmitRequest: () => void;
  onAcknowledge: () => void;
  reviewRemarks: Record<number, string>;
  onReviewRemarksChange: Dispatch<SetStateAction<Record<number, string>>>;
  onCancelRequest: (requestId: number) => void;
  submittingRequest: boolean;
  acknowledgingReview: boolean;
  highlightedRequestId: number | null;
}) {
  const review = props.review;

  return (
    <div className="space-y-4">
      <DashboardSection
        title="Attendance review"
        description={
          props.currentUsername
            ? `Review attendance records and exceptions for ${props.currentUsername}.`
            : "Review attendance records and exceptions for this account."
        }
      >
        <div className="ui-toolbar grid gap-3 md:grid-cols-[280px_minmax(0,1fr)]">
          <select
            value={props.selectedCutoffId ?? ""}
            onChange={(event) => props.onSelectCutoff(Number(event.target.value))}
            className="ui-select"
          >
            {props.cutoffs.map((cutoff) => (
              <option key={cutoff.id} value={cutoff.id}>
                {formatDate(cutoff.cutoff_start)} to {formatDate(cutoff.cutoff_end)} •{" "}
                {formatStatusLabel(cutoff.status)}
              </option>
            ))}
          </select>
          <div className="ui-toolbar-muted text-sm text-slate-600">
            Select a cutoff to review daily logs, acknowledge attendance, and submit corrections before payroll is finalized.
          </div>
        </div>
      </DashboardSection>

      {props.loading ? (
        <ResourceTableSkeleton rowCount={4} />
      ) : review ? (
        <>
          <DashboardSection
            title="Cutoff attendance summary"
            description="Payroll-ready totals for the selected cutoff."
            action={<StatusPill status={review.summary.review_status} compact />}
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <MetricCard label="Work Days" value={String(review.summary.total_work_days)} />
              <MetricCard label="Late" value={String(review.summary.total_late_minutes)} />
              <MetricCard
                label="Undertime"
                value={String(review.summary.total_undertime_minutes)}
              />
              <MetricCard
                label="Overtime"
                value={String(review.summary.total_overtime_minutes)}
              />
              <MetricCard
                label="Night Diff"
                value={String(review.summary.total_night_differential_minutes)}
              />
              <MetricCard
                label="Exceptions"
                value={String(review.summary.unresolved_exceptions_count)}
              />
            </div>

            <div className="ui-action-bar ui-sticky-band mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                {review.summary.acknowledged_at
                  ? `Acknowledged ${formatPhilippineDateTime(review.summary.acknowledged_at)}`
                  : "Attendance review is still pending your acknowledgment."}
              </p>
              <button
                type="button"
                onClick={props.onAcknowledge}
                disabled={!review.can_acknowledge || props.acknowledgingReview}
                className="ui-button-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {props.acknowledgingReview ? "Saving..." : "Acknowledge attendance"}
              </button>
            </div>
          </DashboardSection>

          <DashboardSection
            title="Daily attendance logs"
            description="Review imported logs, missing entries, and computed minutes for the selected cutoff."
          >
            <div className="ui-table-shell">
              <table className="min-w-full border-separate border-spacing-0 bg-white">
                <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Day</th>
                    <th className="px-4 py-3">Time In</th>
                    <th className="px-4 py-3">Time Out</th>
                    <th className="px-4 py-3">Late</th>
                    <th className="px-4 py-3">Undertime</th>
                    <th className="px-4 py-3">Overtime</th>
                    <th className="px-4 py-3">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {review.records.map((record) => (
                    <tr
                      key={record.id}
                      className={cn(
                        "ui-table-row text-sm text-slate-700",
                        (record.has_missing_time_in || record.has_missing_time_out) &&
                          "ui-table-row-selected",
                      )}
                    >
                      <td className="px-4 py-4">{formatDate(record.attendance_date)}</td>
                      <td className="px-4 py-4">{formatWeekday(record.attendance_date)}</td>
                      <td className="px-4 py-4">{formatTime(record.time_in ?? undefined)}</td>
                      <td className="px-4 py-4">{formatTime(record.time_out ?? undefined)}</td>
                      <td className="px-4 py-4">{record.late_minutes}</td>
                      <td className="px-4 py-4">{record.undertime_minutes}</td>
                      <td className="px-4 py-4">{record.overtime_minutes}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <span>{record.remarks ?? record.status}</span>
                          {record.has_missing_time_in || record.has_missing_time_out ? (
                            <span className="text-xs uppercase tracking-[0.16em] text-amber-600">
                              Missing log detected
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardSection>

          <DashboardSection
            title="Submit attendance correction"
            description="File a correction or dispute for missing logs, incorrect uploads, or wrong computed attendance results."
          >
            <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
              <div className="space-y-4">
                <Field label="Attendance Record">
                  <select
                  value={props.requestDraft.attendance_record_id}
                  onChange={(event) =>
                      props.onRequestDraftChange((current) => {
                        const nextRecord = review.records.find(
                          (record) => String(record.id) === event.target.value,
                        );
                        return {
                          ...current,
                          attendance_record_id: event.target.value,
                          attendance_date: nextRecord?.attendance_date ?? current.attendance_date,
                        };
                      })
                    }
                    className="ui-select"
                  >
                    <option value="">Date-only dispute / no imported record</option>
                    {review.records.map((record) => (
                      <option key={record.id} value={record.id}>
                        {formatDate(record.attendance_date)} •{" "}
                        {formatWeekday(record.attendance_date, { weekday: "short" })} • {record.status}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Attendance Date">
                  <input
                    type="date"
                    value={props.requestDraft.attendance_date}
                    onChange={(event) =>
                      props.onRequestDraftChange((current) => ({
                        ...current,
                        attendance_date: event.target.value,
                      }))
                    }
                    className="ui-select"
                  />
                </Field>
              </div>

              <RequestDraftFields
                draft={props.requestDraft}
                onDraftChange={props.onRequestDraftChange}
              />
            </div>

            <div className="ui-action-bar mt-4 flex justify-end">
              <button
                type="button"
                onClick={props.onSubmitRequest}
                disabled={!review.can_submit_requests || props.submittingRequest}
                className="ui-button-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {props.submittingRequest ? "Submitting..." : "Submit attendance request"}
              </button>
            </div>
          </DashboardSection>

          <DashboardSection
            title="Request history"
            description="Track status changes, review remarks, and timestamps for the requests you submitted."
          >
            {review.requests.length > 0 ? (
              <div className="space-y-3">
                {review.requests.map((request) => (
                  <article
                    key={request.id}
                    className={cn(
                      "rounded-[24px] border border-slate-200/80 bg-linear-to-r from-white via-slate-50/85 to-slate-50/65 p-4 shadow-sm",
                      props.highlightedRequestId === request.id &&
                        "border-sky-300 ring-2 ring-sky-200 shadow-[inset_4px_0_0_0_rgba(2,132,199,0.7)]",
                    )}
                  >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {formatRequestTypeLabel(request.request_type)}
                      </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                          {formatDate(request.attendance_date_snapshot)}
                        </p>
                    </div>
                    <StatusPill status={request.status} compact />
                  </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <MetaItem label="Original" value={formatRequestTimelineValue(request, "original")} />
                      <MetaItem label="Requested" value={formatRequestTimelineValue(request, "requested")} />
                      <MetaItem
                        label="Applied"
                        value={
                          request.applied_at
                            ? formatPhilippineDateTime(request.applied_at)
                            : "Pending review"
                        }
                      />
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-600">{request.reason}</p>
                    {request.remarks ? (
                      <p className="mt-2 text-sm text-slate-500">Notes: {request.remarks}</p>
                    ) : null}
                    <p className="mt-4 text-xs uppercase tracking-[0.16em] text-slate-500">
                      Submitted {formatPhilippineDateTime(request.created_at)}
                      {request.reviewed_at
                        ? ` • Reviewed ${formatPhilippineDateTime(request.reviewed_at)}`
                        : ""}
                    </p>
                    {request.review_remarks ? (
                      <p className="mt-2 text-sm text-slate-600">
                        Remarks: {request.review_remarks}
                      </p>
                    ) : null}
                    {request.status === "pending" ? (
                      <div className="ui-action-bar mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                        <input
                          type="text"
                          value={props.reviewRemarks[request.id] ?? ""}
                          onChange={(event) =>
                            props.onReviewRemarksChange((current) => ({
                              ...current,
                              [request.id]: event.target.value,
                            }))
                          }
                          placeholder="Optional cancellation note"
                          className="ui-select"
                        />
                        <button
                          type="button"
                          onClick={() => props.onCancelRequest(request.id)}
                          className="ui-button-secondary md:self-start"
                        >
                          Cancel request
                        </button>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <ResourceEmptyState
                title="No attendance requests yet"
                description="Attendance correction requests you submit for this cutoff will appear here."
              />
            )}
          </DashboardSection>
        </>
      ) : (
        <ResourceEmptyState
          title="No attendance review yet"
          description="Your attendance summary will appear here after attendance for the selected cutoff has been uploaded."
        />
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function RequestDraftFields(props: {
  draft: RequestDraftState;
  onDraftChange: Dispatch<SetStateAction<RequestDraftState>>;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <Field label="Request Type">
          <select
            value={props.draft.request_type}
            onChange={(event) =>
              props.onDraftChange((current) => ({
                ...current,
                request_type: event.target.value as RequestDraftState["request_type"],
              }))
            }
            className="ui-select"
          >
            {ATTENDANCE_REQUEST_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Requested Time In">
          <input
            type="time"
            value={props.draft.requested_time_in}
            onChange={(event) =>
              props.onDraftChange((current) => ({
                ...current,
                requested_time_in: event.target.value,
              }))
            }
            className="ui-select"
          />
        </Field>

        <Field label="Requested Time Out">
          <input
            type="time"
            value={props.draft.requested_time_out}
            onChange={(event) =>
              props.onDraftChange((current) => ({
                ...current,
                requested_time_out: event.target.value,
              }))
            }
            className="ui-select"
          />
        </Field>

        <Field label="Requested Overtime Minutes">
          <input
            type="number"
            min="0"
            value={props.draft.requested_overtime_minutes}
            onChange={(event) =>
              props.onDraftChange((current) => ({
                ...current,
                requested_overtime_minutes: event.target.value,
              }))
            }
            className="ui-select"
          />
        </Field>

        <Field label="Undertime Explanation">
          <input
            type="text"
            value={props.draft.requested_undertime_reason}
            onChange={(event) =>
              props.onDraftChange((current) => ({
                ...current,
                requested_undertime_reason: event.target.value,
              }))
            }
            className="ui-select"
          />
        </Field>

        <Field label="Supporting Notes">
          <input
            type="text"
            value={props.draft.remarks}
            onChange={(event) =>
              props.onDraftChange((current) => ({
                ...current,
                remarks: event.target.value,
              }))
            }
            className="ui-select"
          />
        </Field>
      </div>

      <Field label="Reason">
        <textarea
          value={props.draft.reason}
          onChange={(event) =>
            props.onDraftChange((current) => ({
              ...current,
              reason: event.target.value,
            }))
          }
          rows={4}
          className="ui-textarea min-h-28"
        />
      </Field>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="ui-metric-card">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel-subtle rounded-2xl px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm text-slate-700">{value}</p>
    </div>
  );
}

function StatusPill({
  status,
  compact = false,
}: {
  status: string;
  compact?: boolean;
}) {
  const normalizedStatus = status.toLowerCase();
  const tone = normalizedStatus.includes("approved") || normalizedStatus.includes("acknowledged")
    ? "ui-badge-success"
    : normalizedStatus.includes("locked")
      ? "bg-slate-900 text-white ring-slate-900/10"
      : normalizedStatus.includes("pending") || normalizedStatus.includes("review")
        ? "ui-badge-warning"
        : normalizedStatus.includes("reject") || normalizedStatus.includes("declined")
          ? "ui-badge-danger"
          : "ui-badge-neutral";

  return (
    <span
      className={cn(
        "ui-badge uppercase tracking-[0.16em]",
        tone,
        compact && "px-2.5 py-1 text-[11px]",
      )}
    >
      {formatStatusLabel(status)}
    </span>
  );
}

function SimpleTable({
  title,
  headers,
  rows,
  emptyMessage = "No rows available.",
}: {
  title: string;
  headers: string[];
  rows: string[][];
  emptyMessage?: string;
}) {
  return (
    <div className="ui-table-shell">
      <div className="border-b border-slate-200/80 bg-slate-50/70 px-4 py-3">
        <p className="text-sm font-semibold text-slate-950">{title}</p>
      </div>
      {rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="px-4 py-3">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`${title}-${rowIndex}`} className="ui-table-row text-sm text-slate-700">
                  {row.map((cell, cellIndex) => (
                    <td key={`${title}-${rowIndex}-${cellIndex}`} className="px-4 py-3 align-top">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-4 py-6 text-sm text-slate-500">{emptyMessage}</div>
      )}
    </div>
  );
}

function formatStatusLabel(value: string) {
  return value
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function formatRequestTypeLabel(value: string) {
  return value
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function formatRequestTimelineValue(
  request: AttendanceReviewRequestRecord,
  mode: "original" | "requested",
) {
  if (mode === "original") {
    if (request.original_time_in || request.original_time_out) {
      return `${formatTime(request.original_time_in ?? undefined)} / ${formatTime(
        request.original_time_out ?? undefined,
      )}`;
    }
    return request.attendance_record_id ? "No captured time" : "No imported record";
  }

  const parts: string[] = [];
  if (request.requested_time_in || request.requested_time_out) {
    parts.push(
      `${formatTime(request.requested_time_in ?? undefined)} / ${formatTime(
        request.requested_time_out ?? undefined,
      )}`,
    );
  }
  if (request.requested_overtime_minutes != null) {
    parts.push(`OT ${request.requested_overtime_minutes} mins`);
  }
  if (request.requested_undertime_reason) {
    parts.push("With undertime note");
  }

  return parts.join(" | ") || "See request details";
}
