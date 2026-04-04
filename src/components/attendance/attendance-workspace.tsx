"use client";

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
  createAttendanceCutoff,
  createAttendanceReviewRequest,
  getAttendanceCutoffSummary,
  getAttendanceCutoffs,
  getAttendanceReviewRequests,
  getMyAttendanceReview,
  lockAttendanceCutoff,
  rejectAttendanceReviewRequest,
  uploadAttendanceCsv,
  type CreateAttendanceReviewRequestPayload,
} from "@/lib/api/attendance";
import { formatDate, formatTime } from "@/lib/format";
import { formatPhilippineDateTime } from "@/lib/format/philippine-time";
import {
  canManageAttendanceUploads,
  canManageTeamAttendance,
  type AppRole,
} from "@/lib/auth/session";
import type {
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
  attendance_record_id: string;
  request_type: AttendanceReviewRequestRecord["request_type"];
  requested_time_in: string;
  requested_time_out: string;
  requested_overtime_minutes: string;
  requested_undertime_reason: string;
  reason: string;
};

const DEFAULT_REQUEST_DRAFT: RequestDraftState = {
  attendance_record_id: "",
  request_type: "attendance-correction",
  requested_time_in: "",
  requested_time_out: "",
  requested_overtime_minutes: "",
  requested_undertime_reason: "",
  reason: "",
};

const ATTENDANCE_REQUEST_TYPE_OPTIONS = [
  { value: "attendance-correction", label: "Attendance Correction" },
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
  const [requestFilterStatus, setRequestFilterStatus] = useState("");
  const [requestFilterEmployee, setRequestFilterEmployee] = useState("");
  const [reviewRemarks, setReviewRemarks] = useState<Record<number, string>>({});
  const [loadingCutoffs, setLoadingCutoffs] = useState(true);
  const [loadingTeamSummary, setLoadingTeamSummary] = useState(false);
  const [loadingMyReview, setLoadingMyReview] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [creatingCutoff, setCreatingCutoff] = useState(false);
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
        const nextCutoffId =
          Number.isFinite(cutoffIdFromUrl) && cutoffIdFromUrl > 0
            ? cutoffIdFromUrl
            : cutoffRecords[0]?.id ?? null;
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
  }, [searchParams]);

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
            ...current,
            attendance_record_id:
              current.attendance_record_id || String(reviewResult.records[0]?.id ?? ""),
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

  function updateSearchParams(nextTabId: string, nextCutoffId?: number | null) {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("tab", nextTabId);

    if (nextCutoffId != null) {
      nextParams.set("cutoffId", String(nextCutoffId));
    }

    router.replace(`${pathname}?${nextParams.toString()}`);
  }

  function handleSelectCutoff(nextCutoffId: number) {
    setSelectedCutoffId(nextCutoffId);
    updateSearchParams(initialTabId, nextCutoffId);
  }

  async function handleCreateCutoff() {
    if (!canManageAttendanceImports) {
      setInlineError("Only Finance and HR users can create attendance cutoffs.");
      return;
    }

    if (!createCutoffStart || !createCutoffEnd) {
      setInlineError("Select both cutoff start and cutoff end dates.");
      return;
    }

    setCreatingCutoff(true);
    setInlineError(null);
    setSuccessMessage(null);

    try {
      const cutoff = await createAttendanceCutoff({
        cutoff_start: createCutoffStart,
        cutoff_end: createCutoffEnd,
      });
      setCutoffs((current) => [cutoff, ...current]);
      setSelectedCutoffId(cutoff.id);
      setCreateCutoffStart("");
      setCreateCutoffEnd("");
      setSuccessMessage("Attendance cutoff created.");
      updateSearchParams("team-attendance", cutoff.id);
    } catch (error) {
      setInlineError(
        error instanceof Error ? error.message : "Unable to create attendance cutoff.",
      );
    } finally {
      setCreatingCutoff(false);
    }
  }

  async function handleUploadAttendance() {
    if (!canManageAttendanceImports) {
      setInlineError("Only Finance and HR users can upload attendance CSV files.");
      return;
    }

    if (selectedCutoffId == null) {
      setInlineError("Select a cutoff before uploading attendance.");
      return;
    }
    if (!selectedUploadFile) {
      setInlineError("Choose a CSV file before uploading.");
      return;
    }

    setUploadingAttendance(true);
    setInlineError(null);
    setSuccessMessage(null);
    const activeCutoffId = selectedCutoffId;

    try {
      const summary = await uploadAttendanceCsv(activeCutoffId, selectedUploadFile);
      setImportSummary(summary);
      setSelectedUploadFile(null);
      setSuccessMessage("Attendance CSV uploaded and processed.");
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
      setInlineError(
        error instanceof Error ? error.message : "Unable to upload attendance CSV.",
      );
    } finally {
      setUploadingAttendance(false);
    }
  }

  async function handleAcknowledgeReview() {
    if (selectedCutoffId == null) {
      return;
    }

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
  }

  async function handleSubmitAttendanceRequest() {
    if (selectedCutoffId == null) {
      return;
    }

    const payload: CreateAttendanceReviewRequestPayload = {
      cutoff_id: selectedCutoffId,
      attendance_record_id: Number(requestDraft.attendance_record_id),
      request_type: requestDraft.request_type,
      requested_time_in: requestDraft.requested_time_in || null,
      requested_time_out: requestDraft.requested_time_out || null,
      requested_overtime_minutes: requestDraft.requested_overtime_minutes
        ? Number(requestDraft.requested_overtime_minutes)
        : null,
      requested_undertime_reason: requestDraft.requested_undertime_reason || null,
      reason: requestDraft.reason,
    };

    setSubmittingRequest(true);
    setInlineError(null);
    setSuccessMessage(null);
    const activeCutoffId = selectedCutoffId;

    try {
      await createAttendanceReviewRequest(payload);
      const [nextReview, nextTeamSummary, nextRequests] = await Promise.all([
        getMyAttendanceReview(activeCutoffId),
        canReviewTeamAttendance
          ? getAttendanceCutoffSummary(activeCutoffId)
          : Promise.resolve(null),
        canReviewTeamAttendance
          ? getAttendanceReviewRequests({ cutoffId: activeCutoffId })
          : Promise.resolve([]),
      ]);
      setMyReview(nextReview);
      if (nextTeamSummary) {
        setTeamSummary(nextTeamSummary);
      }
      if (canReviewTeamAttendance) {
        setRequests(nextRequests);
      }
      setRequestDraft({
        ...DEFAULT_REQUEST_DRAFT,
        attendance_record_id: String(nextReview.records[0]?.id ?? ""),
      });
      setSuccessMessage("Attendance review request submitted.");
    } catch (error) {
      setInlineError(
        error instanceof Error ? error.message : "Unable to submit attendance request.",
      );
    } finally {
      setSubmittingRequest(false);
    }
  }

  async function handleReviewRequest(requestId: number, action: "approve" | "reject") {
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
        const activeCutoffId = selectedCutoffId;
        const [nextSummary, nextRequests] = await Promise.all([
          getAttendanceCutoffSummary(activeCutoffId),
          getAttendanceReviewRequests({
            cutoffId: activeCutoffId,
            status: requestFilterStatus || null,
            employee: requestFilterEmployee || null,
          }),
        ]);
        setTeamSummary(nextSummary);
        setRequests(nextRequests);
        setMyReview(await getMyAttendanceReview(activeCutoffId).catch(() => null));
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
  }

  async function handleLockCutoff() {
    if (!canManageAttendanceImports) {
      setInlineError("Only Finance and HR users can lock attendance cutoffs.");
      return;
    }

    if (selectedCutoffId == null) {
      return;
    }

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

  if (cutoffs.length === 0) {
    return (
      <ResourceEmptyState
        title="No attendance cutoffs yet"
        description={
          canManageAttendanceImports
            ? "Create a cutoff period first, then upload the attendance CSV for payroll review."
            : canReviewTeamAttendance
              ? "Attendance cutoffs will appear here once Finance or HR creates one for review."
              : "Attendance cutoffs will appear here once Finance or HR uploads attendance for your payroll period."
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
      {inlineError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-800">
          {inlineError}
        </div>
      ) : null}
      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
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
                onCreateCutoff={handleCreateCutoff}
                canManageAttendanceImports={canManageAttendanceImports}
                creatingCutoff={creatingCutoff}
                selectedUploadFile={selectedUploadFile}
                onUploadFileChange={setSelectedUploadFile}
                onUploadAttendance={handleUploadAttendance}
                uploadingAttendance={uploadingAttendance}
                importSummary={importSummary}
                summary={teamSummary}
                loadingSummary={loadingTeamSummary}
                requests={requests}
                loadingRequests={loadingRequests}
                requestFilterStatus={requestFilterStatus}
                requestFilterEmployee={requestFilterEmployee}
                onRequestFilterStatusChange={setRequestFilterStatus}
                onRequestFilterEmployeeChange={setRequestFilterEmployee}
                reviewRemarks={reviewRemarks}
                onReviewRemarksChange={setReviewRemarks}
                onReviewRequest={handleReviewRequest}
                onLockCutoff={handleLockCutoff}
                lockingCutoff={lockingCutoff}
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

function TeamAttendancePanel(props: {
  cutoffs: AttendanceCutoffRecord[];
  selectedCutoffId: number | null;
  onSelectCutoff: (cutoffId: number) => void;
  createCutoffStart: string;
  createCutoffEnd: string;
  onCreateCutoffStartChange: (value: string) => void;
  onCreateCutoffEndChange: (value: string) => void;
  onCreateCutoff: () => void;
  canManageAttendanceImports: boolean;
  creatingCutoff: boolean;
  selectedUploadFile: File | null;
  onUploadFileChange: (file: File | null) => void;
  onUploadAttendance: () => void;
  uploadingAttendance: boolean;
  importSummary: AttendanceImportSummaryRecord | null;
  summary: AttendanceCutoffSummaryRecord | null;
  loadingSummary: boolean;
  requests: AttendanceReviewRequestRecord[];
  loadingRequests: boolean;
  requestFilterStatus: string;
  requestFilterEmployee: string;
  onRequestFilterStatusChange: (value: string) => void;
  onRequestFilterEmployeeChange: (value: string) => void;
  reviewRemarks: Record<number, string>;
  onReviewRemarksChange: Dispatch<SetStateAction<Record<number, string>>>;
  onReviewRequest: (requestId: number, action: "approve" | "reject") => void;
  onLockCutoff: () => void;
  lockingCutoff: boolean;
  highlightedRequestId: number | null;
}) {
  const selectedCutoff =
    props.cutoffs.find((cutoff) => cutoff.id === props.selectedCutoffId) ?? props.cutoffs[0];

  return (
    <div className="space-y-4">
      {props.canManageAttendanceImports ? (
        <DashboardSection
          title="Cutoff setup and upload"
          description="Create a cutoff first, then upload the attendance CSV that belongs to that payroll range."
        >
          <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Create cutoff
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
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
              <button
                type="button"
                onClick={props.onCreateCutoff}
                disabled={props.creatingCutoff}
                className="mt-4 ui-button-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {props.creatingCutoff ? "Creating cutoff..." : "Create cutoff"}
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Upload attendance CSV
              </p>
              <div className="mt-4 space-y-3">
                <Field label="Selected Cutoff">
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
                  Supported headers: `employee_code` or `employee_id`, `attendance_date`,
                  `time_in`, `time_out`, `remarks`.
                </p>
                <button
                  type="button"
                  onClick={props.onUploadAttendance}
                  disabled={props.uploadingAttendance}
                  className="ui-button-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {props.uploadingAttendance ? "Uploading..." : "Upload attendance"}
                </button>
              </div>
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
                formatTime(row.time_in ?? undefined),
                formatTime(row.time_out ?? undefined),
                row.status,
              ])}
              headers={["Employee", "Date", "Time In", "Time Out", "Status"]}
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

            <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200/80">
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
                      className="border-t border-slate-200/80 text-sm text-slate-700"
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

            <div className="mt-5 flex justify-end">
              {props.canManageAttendanceImports ? (
                <button
                  type="button"
                  onClick={props.onLockCutoff}
                  disabled={props.lockingCutoff || props.summary.cutoff.status === "locked"}
                  className="ui-button-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {props.lockingCutoff ? "Locking cutoff..." : "Lock cutoff"}
                </button>
              ) : null}
            </div>
          </>
        ) : (
          <ResourceEmptyState
            title="No uploaded attendance yet"
            description={
              props.canManageAttendanceImports
                ? "Upload a CSV for the selected cutoff to generate employee summaries and review queues."
                : "Attendance summaries will appear here once Finance or HR uploads the cutoff data."
            }
          />
        )}
      </DashboardSection>

      <DashboardSection
        title="Attendance requests for approval"
        description="Review employee attendance correction requests by cutoff, status, and employee."
      >
        <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
          <select
            value={props.requestFilterStatus}
            onChange={(event) => props.onRequestFilterStatusChange(event.target.value)}
            className="ui-select"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
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
                  "rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4",
                  props.highlightedRequestId === request.id &&
                    "border-emerald-300 ring-2 ring-emerald-200",
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
                  <MetaItem
                    label="Requested Time In"
                    value={request.requested_time_in ? formatTime(request.requested_time_in) : "--"}
                  />
                  <MetaItem
                    label="Requested Time Out"
                    value={request.requested_time_out ? formatTime(request.requested_time_out) : "--"}
                  />
                  <MetaItem
                    label="Requested OT"
                    value={
                      request.requested_overtime_minutes != null
                        ? `${request.requested_overtime_minutes} mins`
                        : "--"
                    }
                  />
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">{request.reason}</p>

                {request.status === "pending" ? (
                  <div className="mt-4 flex flex-col gap-3 md:flex-row">
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
  submittingRequest: boolean;
  acknowledgingReview: boolean;
  highlightedRequestId: number | null;
}) {
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
        <div className="grid gap-3 md:grid-cols-[280px_minmax(0,1fr)]">
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
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm text-slate-600">
            Select a cutoff to review daily logs, acknowledge attendance, and submit corrections before payroll is finalized.
          </div>
        </div>
      </DashboardSection>

      {props.loading ? (
        <ResourceTableSkeleton rowCount={4} />
      ) : props.review ? (
        <>
          <DashboardSection
            title="Cutoff attendance summary"
            description="Payroll-ready totals for the selected cutoff."
            action={<StatusPill status={props.review.summary.review_status} compact />}
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <MetricCard label="Work Days" value={String(props.review.summary.total_work_days)} />
              <MetricCard label="Late" value={String(props.review.summary.total_late_minutes)} />
              <MetricCard
                label="Undertime"
                value={String(props.review.summary.total_undertime_minutes)}
              />
              <MetricCard
                label="Overtime"
                value={String(props.review.summary.total_overtime_minutes)}
              />
              <MetricCard
                label="Night Diff"
                value={String(props.review.summary.total_night_differential_minutes)}
              />
              <MetricCard
                label="Exceptions"
                value={String(props.review.summary.unresolved_exceptions_count)}
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                {props.review.summary.acknowledged_at
                  ? `Acknowledged ${formatPhilippineDateTime(props.review.summary.acknowledged_at)}`
                  : "Attendance review is still pending your acknowledgment."}
              </p>
              <button
                type="button"
                onClick={props.onAcknowledge}
                disabled={!props.review.can_acknowledge || props.acknowledgingReview}
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
            <div className="overflow-hidden rounded-[24px] border border-slate-200/80">
              <table className="min-w-full border-separate border-spacing-0 bg-white">
                <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Time In</th>
                    <th className="px-4 py-3">Time Out</th>
                    <th className="px-4 py-3">Late</th>
                    <th className="px-4 py-3">Undertime</th>
                    <th className="px-4 py-3">Overtime</th>
                    <th className="px-4 py-3">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {props.review.records.map((record) => (
                    <tr key={record.id} className="border-t border-slate-200/80 text-sm text-slate-700">
                      <td className="px-4 py-4">{formatDate(record.attendance_date)}</td>
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
            title="Submit attendance request"
            description="File overtime, undertime explanations, and attendance corrections for the selected cutoff."
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <Field label="Attendance Date">
                <select
                  value={props.requestDraft.attendance_record_id}
                  onChange={(event) =>
                    props.onRequestDraftChange((current) => ({
                      ...current,
                      attendance_record_id: event.target.value,
                    }))
                  }
                  className="ui-select"
                >
                  {props.review.records.map((record) => (
                    <option key={record.id} value={record.id}>
                      {formatDate(record.attendance_date)} • {record.status}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Request Type">
                <select
                  value={props.requestDraft.request_type}
                  onChange={(event) =>
                    props.onRequestDraftChange((current) => ({
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
                  value={props.requestDraft.requested_time_in}
                  onChange={(event) =>
                    props.onRequestDraftChange((current) => ({
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
                  value={props.requestDraft.requested_time_out}
                  onChange={(event) =>
                    props.onRequestDraftChange((current) => ({
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
                  value={props.requestDraft.requested_overtime_minutes}
                  onChange={(event) =>
                    props.onRequestDraftChange((current) => ({
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
                  value={props.requestDraft.requested_undertime_reason}
                  onChange={(event) =>
                    props.onRequestDraftChange((current) => ({
                      ...current,
                      requested_undertime_reason: event.target.value,
                    }))
                  }
                  className="ui-select"
                />
              </Field>
            </div>

            <Field label="Reason">
              <textarea
                value={props.requestDraft.reason}
                onChange={(event) =>
                  props.onRequestDraftChange((current) => ({
                    ...current,
                    reason: event.target.value,
                  }))
                }
                rows={4}
                className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
              />
            </Field>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={props.onSubmitRequest}
                disabled={!props.review.can_submit_requests || props.submittingRequest}
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
            {props.review.requests.length > 0 ? (
              <div className="space-y-3">
                {props.review.requests.map((request) => (
                  <article
                    key={request.id}
                    className={cn(
                      "rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4",
                      props.highlightedRequestId === request.id &&
                        "border-emerald-300 ring-2 ring-emerald-200",
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
                    <p className="mt-4 text-sm leading-6 text-slate-600">{request.reason}</p>
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3">
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
    ? "bg-emerald-100 text-emerald-700"
    : normalizedStatus.includes("locked")
      ? "bg-slate-900 text-white"
      : normalizedStatus.includes("pending") || normalizedStatus.includes("review")
        ? "bg-amber-100 text-amber-700"
        : normalizedStatus.includes("reject") || normalizedStatus.includes("declined")
          ? "bg-rose-100 text-rose-700"
          : "bg-slate-100 text-slate-700";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
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
    <div className="rounded-2xl border border-slate-200/80 bg-white">
      <div className="border-b border-slate-200/80 px-4 py-3">
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
                <tr key={`${title}-${rowIndex}`} className="border-t border-slate-200/80 text-sm text-slate-700">
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
