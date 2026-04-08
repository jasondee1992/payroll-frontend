"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CurrentEmployeeRequestContext } from "@/lib/api/current-employee";
import type { TimeRequestRecord } from "@/lib/api/time-requests";
import type { AppRole } from "@/lib/auth/session";
import { formatPhilippineDateTime } from "@/lib/format/philippine-time";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { SectionCard } from "@/components/ui/section-card";
import {
  createTimeRequest,
  getTimeRequests,
  updateTimeRequestStatus,
} from "@/lib/api/time-requests";
import { usePreservedScroll } from "@/lib/use-preserved-scroll";
import {
  allRequestTypes,
  requestGroups,
  type RequestCatalogItem,
} from "./request-definitions";

type FilingFormState = {
  dateFrom: string;
  dateTo: string;
  requestDate: string;
  startTime: string;
  endTime: string;
  actualTime: string;
  expectedTime: string;
  location: string;
  coveragePlan: string;
  reason: string;
  attachmentLabel: string;
  contactPerson: string;
  managerName: string;
};

type TimeRequestTab = "file" | "mine" | "all";

const REQUEST_REFRESH_INTERVAL_MS = 5000;

const quickPickIds = [
  "vacation-leave",
  "sick-leave",
  "overtime",
  "undertime",
  "missing-time-log",
  "official-business",
];

export function RequestFilingWorkspace({
  currentRole,
  currentUsername,
  currentEmployeeContext,
  currentEmployeeContextErrorMessage,
}: {
  currentRole?: AppRole | null;
  currentUsername?: string | null;
  currentEmployeeContext?: CurrentEmployeeRequestContext | null;
  currentEmployeeContextErrorMessage?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { captureScrollPosition, restoreScrollPosition } = usePreservedScroll();
  const reportingManagerName =
    currentEmployeeContext?.reportingManagerName ?? null;
  const isReportingManager =
    currentEmployeeContext?.isReportingManager ?? false;
  const [selectedTypeId, setSelectedTypeId] = useState(allRequestTypes[0]?.id ?? "");
  const selectedType =
    allRequestTypes.find((item) => item.id === selectedTypeId) ?? allRequestTypes[0];
  const [formState, setFormState] = useState<FilingFormState>(() =>
    createEmptyFormState(reportingManagerName),
  );
  const [myRequests, setMyRequests] = useState<TimeRequestRecord[]>([]);
  const [allRequests, setAllRequests] = useState<TimeRequestRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [recordsErrorMessage, setRecordsErrorMessage] = useState<string | null>(null);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [hasLoadedRecords, setHasLoadedRecords] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewingRequestId, setReviewingRequestId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TimeRequestTab>("file");
  const highlightedRequestId = parseRequestId(searchParams.get("requestId"));
  const requestedTab = parseTimeRequestTab(searchParams.get("tab"));

  const currentStep = useMemo(() => {
    if (!selectedType) {
      return 1;
    }

    if (hasRequiredValues(selectedType, formState)) {
      return 3;
    }

    return formState.reason.trim() ? 2 : 1;
  }, [formState, selectedType]);

  useEffect(() => {
    setFormState((current) => ({
      ...current,
      managerName: reportingManagerName ?? "",
    }));
  }, [reportingManagerName]);

  useEffect(() => {
    if (activeTab === "all" && !canAccessAllRequests(currentRole, isReportingManager)) {
      setActiveTab("mine");
    }
  }, [activeTab, currentRole, isReportingManager]);

  useEffect(() => {
    if (!requestedTab) {
      return;
    }

    if (requestedTab === "all" && !canAccessAllRequests(currentRole, isReportingManager)) {
      setActiveTab("mine");
      return;
    }

    setActiveTab(requestedTab);
  }, [currentRole, isReportingManager, requestedTab]);

  useEffect(() => {
    let isCancelled = false;

    async function loadRequests(options?: { background?: boolean }) {
      const shouldShowLoadingState =
        !options?.background && !hasLoadedRecords;

      if (shouldShowLoadingState) {
        setIsLoadingRecords(true);
      }
      setRecordsErrorMessage(null);

      try {
        const pendingLoads: Array<Promise<TimeRequestRecord[]>> = [getTimeRequests("mine")];

        if (canAccessAllRequests(currentRole, isReportingManager)) {
          pendingLoads.push(
            getTimeRequests(canViewAllRequests(currentRole) ? "all" : "reviewer-all"),
          );
        }

        const [mineResult, allResult] = await Promise.all(pendingLoads);

        if (isCancelled) {
          return;
        }

        setMyRequests(mineResult);
        setAllRequests(allResult ?? []);
        setHasLoadedRecords(true);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setRecordsErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load the stored time requests.",
        );
      } finally {
        if (!isCancelled && shouldShowLoadingState) {
          setIsLoadingRecords(false);
        }
      }
    }

    void loadRequests();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadRequests({ background: true });
      }
    }, REQUEST_REFRESH_INTERVAL_MS);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [currentRole, hasLoadedRecords, isReportingManager]);

  async function refreshRequests() {
    setRecordsErrorMessage(null);

    try {
      const pendingLoads: Array<Promise<TimeRequestRecord[]>> = [getTimeRequests("mine")];

      if (canAccessAllRequests(currentRole, isReportingManager)) {
        pendingLoads.push(
          getTimeRequests(canViewAllRequests(currentRole) ? "all" : "reviewer-all"),
        );
      }

      const [mineResult, allResult] = await Promise.all(pendingLoads);

      setMyRequests(mineResult);
      setAllRequests(allResult ?? []);
      setHasLoadedRecords(true);
    } catch (error) {
      setRecordsErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load the stored time requests.",
      );
    }
  }

  function updateSearchParams(nextTab: TimeRequestTab) {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("tab", nextTab);
    router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
  }

  async function preserveContextDuring(action: () => Promise<void>) {
    const scrollPosition = captureScrollPosition();

    try {
      await action();
    } finally {
      restoreScrollPosition(scrollPosition);
    }
  }

  function handleRequestTypeChange(nextTypeId: string) {
    setSelectedTypeId(nextTypeId);
    setFormState(createEmptyFormState(reportingManagerName));
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function handleFieldChange(field: keyof FilingFormState, value: string) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const validationError = validateForm(selectedType, formState);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);

    await preserveContextDuring(async () => {
      try {
        await createTimeRequest({
          request_type_id: selectedType.id,
          date_from: formState.dateFrom || null,
          date_to: formState.dateTo || null,
          request_date: formState.requestDate || null,
          start_time: normalizeTimeValue(formState.startTime),
          end_time: normalizeTimeValue(formState.endTime),
          actual_time: normalizeTimeValue(formState.actualTime),
          expected_time: normalizeTimeValue(formState.expectedTime),
          location: normalizeTextValue(formState.location),
          coverage_plan: normalizeTextValue(formState.coveragePlan),
          reason: formState.reason.trim(),
          attachment_label: normalizeTextValue(formState.attachmentLabel),
          contact_person: normalizeTextValue(formState.contactPerson),
        });

        setFormState(createEmptyFormState(reportingManagerName));
        setSuccessMessage(
          `${selectedType.title} request submitted and stored in the database.`,
        );
        await refreshRequests();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to submit the time request.",
        );
      } finally {
        setIsSubmitting(false);
      }
    });
  }

  async function handleReviewAction(
    requestId: number,
    action: "approve" | "decline",
  ) {
    await preserveContextDuring(async () => {
      setErrorMessage(null);
      setSuccessMessage(null);
      setReviewingRequestId(requestId);

      try {
        await updateTimeRequestStatus(requestId, {
          action,
          note:
            action === "approve"
              ? `Reviewed by ${currentUsername ?? "current reviewer"}`
              : `Declined by ${currentUsername ?? "current reviewer"}`,
        });

        setSuccessMessage(
          action === "approve"
            ? "Request review recorded successfully."
            : "Request was declined successfully.",
        );
        await refreshRequests();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to update the request status.",
        );
      } finally {
        setReviewingRequestId(null);
      }
    });
  }

  useEffect(() => {
    if (!highlightedRequestId || !hasLoadedRecords) {
      return;
    }

    const targetItem =
      activeTab === "all"
        ? allRequests.find((item) => item.id === highlightedRequestId)
        : myRequests.find((item) => item.id === highlightedRequestId);

    if (!targetItem) {
      return;
    }

    const targetElement = document.querySelector<HTMLElement>(
      `[data-request-id="${highlightedRequestId}"]`,
    );

    if (!targetElement) {
      return;
    }

    targetElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [activeTab, allRequests, hasLoadedRecords, highlightedRequestId, myRequests]);

  if (!selectedType) {
    return null;
  }

  const quickPicks = allRequestTypes.filter((item) => quickPickIds.includes(item.id));
  const recordItems = activeTab === "all" ? allRequests : myRequests;
  const tabs = buildTabs(currentRole, isReportingManager);

  return (
    <SectionCard
      title="Request filing process"
      description="File leave, overtime, attendance corrections, and work arrangement requests from one place. Submitted records are stored in the database with timestamps."
    >
      <div className="mb-4 overflow-x-auto">
        <div className="inline-flex min-w-full gap-2 rounded-2xl border border-slate-200/80 bg-white p-2">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  updateSearchParams(tab.id);
                }}
                className={
                  active
                    ? "inline-flex min-w-max items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition"
                    : "inline-flex min-w-max items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "file" ? (
        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="space-y-4">
          <div className="rounded-[26px] border border-slate-200/80 bg-slate-50/70 px-5 py-4 text-sm leading-6 text-slate-700">
            Requests filed here are stored as system records. Every request is routed to the employee&apos;s reporting manager and HR. Once either valid approver approves or declines, the request is finalized.
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <StepCard
              step="1"
              title="Choose type"
              active={currentStep === 1}
              description="Pick the request category to load the correct filing fields."
            />
            <StepCard
              step="2"
              title="Fill details"
              active={currentStep === 2}
              description="Encode dates, time coverage, reason, and support details."
            />
            <StepCard
              step="3"
              title="Submit request"
              active={currentStep === 3}
              description="Review the approval route and save the request to the system."
            />
          </div>

          <div className="rounded-[26px] border border-slate-200/80 bg-slate-50/70 px-5 py-5">
            <div className="flex flex-col gap-3 border-b border-slate-200/80 pb-4">
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  Popular request shortcuts
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Quick-select the most commonly filed requests, or choose any request type from the full list below.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {quickPicks.map((item) => {
                  const active = item.id === selectedType.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleRequestTypeChange(item.id)}
                      className={
                        active
                          ? "rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white"
                          : "rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                      }
                    >
                      {item.tag}: {shortLabel(item.title)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4">
              <label className="flex flex-col gap-2">
                <span className="ui-label">Request type</span>
                <select
                  value={selectedType.id}
                  onChange={(event) => handleRequestTypeChange(event.target.value)}
                  className="ui-select"
                >
                  {requestGroups.map((group) => (
                    <optgroup key={group.title} label={group.title}>
                      {group.items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.title}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="rounded-[26px] border border-slate-200/80 bg-white px-5 py-5">
              <div className="flex flex-col gap-3 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-950">
                    {selectedType.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {selectedType.description}
                  </p>
                </div>
                <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                  {selectedType.tag}
                </span>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {renderFields(selectedType, formState, handleFieldChange)}

                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="ui-label">Reason / request details</span>
                  <textarea
                    value={formState.reason}
                    onChange={(event) =>
                      handleFieldChange("reason", event.target.value)
                    }
                    rows={4}
                    className="ui-input min-h-28 resize-y"
                    placeholder="State the reason, context, and any instructions the approver should review."
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="ui-label">Supporting document note</span>
                  <input
                    type="text"
                    value={formState.attachmentLabel}
                    onChange={(event) =>
                      handleFieldChange("attachmentLabel", event.target.value)
                    }
                    className="ui-input"
                    placeholder="Example: Medical certificate, OB itinerary, photo of DTR log"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="ui-label">Immediate manager</span>
                  <div className="flex min-h-12 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900">
                    {formState.managerName || "No reporting manager assigned"}
                  </div>
                  {currentEmployeeContextErrorMessage ? (
                    <span className="text-xs leading-5 text-amber-700">
                      {currentEmployeeContextErrorMessage}
                    </span>
                  ) : (
                    <span className="text-xs leading-5 text-slate-500">
                      Auto-filled from the employee reporting manager assignment.
                    </span>
                  )}
                </label>

                <label className="flex flex-col gap-2">
                  <span className="ui-label">Coverage / handoff plan</span>
                  <input
                    type="text"
                    value={formState.coveragePlan}
                    onChange={(event) =>
                      handleFieldChange("coveragePlan", event.target.value)
                    }
                    className="ui-input"
                    placeholder="Example: Tasks endorsed to Ana Santos for follow-up"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-[26px] border border-slate-200/80 bg-slate-50/70 px-5 py-5">
              <p className="text-sm font-semibold text-slate-950">Submission review</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <ReviewItem label="Request type" value={selectedType.title} />
                <ReviewItem
                  label="Review approver"
                  value={formState.managerName.trim() || "No reporting manager assigned"}
                />
                <ReviewItem
                  label="Schedule summary"
                  value={buildDraftDateSummary(selectedType, formState)}
                />
              </div>

              {errorMessage ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-6 text-rose-700">
                  {errorMessage}
                </div>
              ) : null}

              {successMessage ? (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-700">
                  {successMessage}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFormState(createEmptyFormState(reportingManagerName));
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="ui-button-secondary"
                  disabled={isSubmitting}
                >
                  Reset form
                </button>
                <button
                  type="submit"
                  className="ui-button-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit request"}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <div className="rounded-[26px] border border-slate-200/80 bg-slate-50/70 px-5 py-5">
            <p className="text-sm font-semibold text-slate-950">Selected request guide</p>
            <div className="mt-4 space-y-3">
              <GuideRow label="Category tag" value={selectedType.tag} />
              <GuideRow label="Form pattern" value={formatFormKind(selectedType.formKind)} />
              <GuideRow label="Approval route" value={selectedType.approvalPath} />
              <GuideRow
                label="Typical document"
                value={documentHint(selectedType)}
              />
            </div>
          </div>
        </div>
      </div>
      ) : null}

      {activeTab === "mine" || activeTab === "all" ? (
        <div className="space-y-4">
          <div className="rounded-[26px] border border-slate-200/80 bg-white px-5 py-5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 pb-4">
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  {activeTab === "all" ? "All recorded requests" : "My recorded requests"}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {activeTab === "all"
                    ? getAllRequestsDescription(currentRole)
                    : "Requests filed by this account are stored here with their timestamps and review status."}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                {activeTab === "all" ? recordItems.length : recordItems.length} items
              </span>
            </div>

            {recordsErrorMessage ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-6 text-rose-700">
                {recordsErrorMessage}
              </div>
            ) : null}

            {isLoadingRecords ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-sm leading-6 text-slate-500">
                Loading request records...
              </div>
            ) : recordItems.length > 0 ? (
              <div className="mt-4 space-y-2.5">
                {recordItems.map((item) => {
                  const extraDetails = buildRequestExtraDetails(item);

                  return (
                    <article
                      key={item.id}
                      data-request-id={item.id}
                      className={
                        item.id === highlightedRequestId
                          ? "rounded-2xl border border-slate-900 bg-slate-50/70 px-4 py-3 ring-2 ring-slate-900/10"
                          : "rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3"
                      }
                      aria-current={item.id === highlightedRequestId ? "true" : undefined}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">
                            {item.request_type_title}
                          </p>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            {buildRequestReference(item.id)}
                          </p>
                        </div>
                        <StatusPill status={item.status} />
                      </div>
                      <div className="mt-2.5 space-y-1.5 text-sm text-slate-600">
                        {activeTab === "all" ? (
                          <InfoRow
                            label="Submitted by"
                            value={formatRequestPersonName(item.employee_name_snapshot)}
                          />
                        ) : null}
                        <InfoRow
                          label={getScheduleLabel(item)}
                          value={buildStoredDateSummary(item)}
                        />
                        <InfoRow label="Reason" value={item.reason.trim()} />
                        {extraDetails.length > 0 ? (
                          <InfoRow
                            label="Other details"
                            value={extraDetails.join(" • ")}
                            tone="muted"
                          />
                        ) : null}
                        <p className="text-xs leading-5 text-slate-500">
                          {buildRequestActivityLine(item)}
                        </p>
                        {activeTab === "all" && canReviewRequest(currentRole, item.status) ? (
                          <div className="flex flex-wrap gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleReviewAction(item.id, "decline")}
                              disabled={reviewingRequestId === item.id}
                              className="inline-flex h-9 items-center justify-center rounded-2xl border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Decline
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReviewAction(item.id, "approve")}
                              disabled={reviewingRequestId === item.id}
                              className="ui-button-primary h-9 px-4 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {reviewingRequestId === item.id ? "Saving..." : "Approve"}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-sm leading-6 text-slate-500">
                No stored requests yet.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </SectionCard>
  );
}

function canViewAllRequests(role: AppRole | null | undefined) {
  return role === "hr";
}

function canAccessAllRequests(
  role: AppRole | null | undefined,
  isReportingManager: boolean,
) {
  return canViewAllRequests(role) || isReportingManager;
}

function canReviewRequest(
  role: AppRole | null | undefined,
  status: TimeRequestRecord["status"],
) {
  if (role === "hr") {
    return status === "pending_manager_approval" || status === "pending_hr_review";
  }

  return status === "pending_manager_approval";
}

function getAllRequestsDescription(role: AppRole | null | undefined) {
  if (canViewAllRequests(role)) {
    return "HR can monitor every request filed in the system and can approve or decline any pending request.";
  }

  return "Requests routed to this account as reporting manager appear here for review. HR can also act on the same pending request.";
}

function buildTabs(role: AppRole | null | undefined, isReportingManager: boolean) {
  const tabs: Array<{ id: TimeRequestTab; label: string }> = [
    { id: "file", label: "File Request" },
    { id: "mine", label: "My Requests" },
  ];

  if (canAccessAllRequests(role, isReportingManager)) {
    tabs.push({ id: "all", label: "All Requests" });
  }

  return tabs;
}

function parseTimeRequestTab(value: string | null): TimeRequestTab | null {
  if (value === "file" || value === "mine" || value === "all") {
    return value;
  }

  return null;
}

function parseRequestId(value: string | null) {
  if (!value) {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function buildRequestReference(requestId: number) {
  return `TR-${String(requestId).padStart(5, "0")}`;
}

function normalizeTextValue(value: string) {
  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function normalizeTimeValue(value: string) {
  return value ? `${value}:00` : null;
}

function createEmptyFormState(
  reportingManagerName: string | null,
): FilingFormState {
  return {
    dateFrom: "",
    dateTo: "",
    requestDate: "",
    startTime: "",
    endTime: "",
    actualTime: "",
    expectedTime: "",
    location: "",
    coveragePlan: "",
    reason: "",
    attachmentLabel: "",
    contactPerson: "",
    managerName: reportingManagerName ?? "",
  };
}

function renderFields(
  selectedType: RequestCatalogItem,
  formState: FilingFormState,
  onChange: (field: keyof FilingFormState, value: string) => void,
) {
  switch (selectedType.formKind) {
    case "leave":
      return (
        <>
          <label className="flex flex-col gap-2">
            <span className="ui-label">Start date</span>
            <input
              type="date"
              value={formState.dateFrom}
              onChange={(event) => onChange("dateFrom", event.target.value)}
              className="ui-input"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="ui-label">End date</span>
            <input
              type="date"
              value={formState.dateTo}
              onChange={(event) => onChange("dateTo", event.target.value)}
              className="ui-input"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="ui-label">Contact person while away</span>
            <input
              type="text"
              value={formState.contactPerson}
              onChange={(event) => onChange("contactPerson", event.target.value)}
              className="ui-input"
              placeholder="Example: Ana Santos"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="ui-label">Temporary location or note</span>
            <input
              type="text"
              value={formState.location}
              onChange={(event) => onChange("location", event.target.value)}
              className="ui-input"
              placeholder="Example: Home recovery, Cebu trip, board exam venue"
            />
          </label>
        </>
      );
    case "overtime":
      return (
        <>
          <label className="flex flex-col gap-2">
            <span className="ui-label">Work date</span>
            <input
              type="date"
              value={formState.requestDate}
              onChange={(event) => onChange("requestDate", event.target.value)}
              className="ui-input"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="ui-label">Location / assignment</span>
            <input
              type="text"
              value={formState.location}
              onChange={(event) => onChange("location", event.target.value)}
              className="ui-input"
              placeholder="Example: Office, branch audit, client site"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="ui-label">Start time</span>
            <input
              type="time"
              value={formState.startTime}
              onChange={(event) => onChange("startTime", event.target.value)}
              className="ui-input"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="ui-label">End time</span>
            <input
              type="time"
              value={formState.endTime}
              onChange={(event) => onChange("endTime", event.target.value)}
              className="ui-input"
            />
          </label>
        </>
      );
    case "attendance":
      return (
        <>
          <label className="flex flex-col gap-2">
            <span className="ui-label">Affected date</span>
            <input
              type="date"
              value={formState.requestDate}
              onChange={(event) => onChange("requestDate", event.target.value)}
              className="ui-input"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="ui-label">Expected time</span>
            <input
              type="time"
              value={formState.expectedTime}
              onChange={(event) => onChange("expectedTime", event.target.value)}
              className="ui-input"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="ui-label">Actual time</span>
            <input
              type="time"
              value={formState.actualTime}
              onChange={(event) => onChange("actualTime", event.target.value)}
              className="ui-input"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="ui-label">Affected location or shift</span>
            <input
              type="text"
              value={formState.location}
              onChange={(event) => onChange("location", event.target.value)}
              className="ui-input"
              placeholder="Example: Main office, morning shift"
            />
          </label>
        </>
      );
    case "arrangement":
      return (
        <>
          <label className="flex flex-col gap-2">
            <span className="ui-label">Request date</span>
            <input
              type="date"
              value={formState.requestDate}
              onChange={(event) => onChange("requestDate", event.target.value)}
              className="ui-input"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="ui-label">Start time</span>
            <input
              type="time"
              value={formState.startTime}
              onChange={(event) => onChange("startTime", event.target.value)}
              className="ui-input"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="ui-label">End time</span>
            <input
              type="time"
              value={formState.endTime}
              onChange={(event) => onChange("endTime", event.target.value)}
              className="ui-input"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="ui-label">Location / work setup</span>
            <input
              type="text"
              value={formState.location}
              onChange={(event) => onChange("location", event.target.value)}
              className="ui-input"
              placeholder="Example: Client site, WFH, branch office"
            />
          </label>
        </>
      );
  }
}

function hasRequiredValues(
  selectedType: RequestCatalogItem,
  formState: FilingFormState,
) {
  switch (selectedType.formKind) {
    case "leave":
      return Boolean(formState.dateFrom && formState.dateTo && formState.reason.trim());
    case "overtime":
      return Boolean(
        formState.requestDate &&
          formState.startTime &&
          formState.endTime &&
          formState.reason.trim(),
      );
    case "attendance":
      return Boolean(
        formState.requestDate &&
          formState.expectedTime &&
          formState.actualTime &&
          formState.reason.trim(),
      );
    case "arrangement":
      return Boolean(
        formState.requestDate &&
          formState.startTime &&
          formState.endTime &&
          formState.reason.trim(),
      );
  }
}

function validateForm(
  selectedType: RequestCatalogItem,
  formState: FilingFormState,
) {
  if (!formState.reason.trim()) {
    return "Add the request reason before submitting.";
  }

  switch (selectedType.formKind) {
    case "leave":
      if (!formState.dateFrom || !formState.dateTo) {
        return "Complete the leave date range before submitting.";
      }

      if (formState.dateTo < formState.dateFrom) {
        return "Leave end date must be on or after the start date.";
      }
      break;
    case "overtime":
      if (!formState.requestDate || !formState.startTime || !formState.endTime) {
        return "Complete the overtime date and time range before submitting.";
      }

      if (formState.endTime <= formState.startTime) {
        return "Overtime end time must be later than the start time.";
      }
      break;
    case "attendance":
      if (!formState.requestDate || !formState.expectedTime || !formState.actualTime) {
        return "Complete the attendance correction time details before submitting.";
      }
      break;
    case "arrangement":
      if (!formState.requestDate || !formState.startTime || !formState.endTime) {
        return "Complete the arrangement date and time coverage before submitting.";
      }

      if (formState.endTime <= formState.startTime) {
        return "Arrangement end time must be later than the start time.";
      }
      break;
  }

  return null;
}

function buildDraftDateSummary(
  selectedType: RequestCatalogItem,
  formState: FilingFormState,
) {
  switch (selectedType.formKind) {
    case "leave":
      if (!formState.dateFrom && !formState.dateTo) {
        return "Waiting for leave dates";
      }

      if (formState.dateFrom && formState.dateTo) {
        return `${formatDate(formState.dateFrom)} to ${formatDate(formState.dateTo)}`;
      }

      return formState.dateFrom || formState.dateTo;
    case "overtime":
    case "arrangement":
      if (!formState.requestDate) {
        return "Waiting for date and time range";
      }

      return `${formatDate(formState.requestDate)}, ${formState.startTime || "--:--"} to ${formState.endTime || "--:--"}`;
    case "attendance":
      if (!formState.requestDate) {
        return "Waiting for attendance date";
      }

      return `${formatDate(formState.requestDate)}, ${formState.actualTime || "--:--"} vs expected ${formState.expectedTime || "--:--"}`;
  }
}

function buildStoredDateSummary(item: TimeRequestRecord) {
  if (item.form_kind === "leave") {
    if (item.date_from && item.date_to) {
      return `Start date: ${formatDate(item.date_from)} | End date: ${formatDate(item.date_to)}`;
    }

    return "Leave schedule pending";
  }

  if (item.form_kind === "overtime" || item.form_kind === "arrangement") {
    if (!item.request_date) {
      return "Schedule pending";
    }

    return `${formatDate(item.request_date)}, ${formatClock(item.start_time)} to ${formatClock(item.end_time)}`;
  }

  if (!item.request_date) {
    return "Attendance date pending";
  }

  return `${formatDate(item.request_date)}, ${formatClock(item.actual_time)} vs expected ${formatClock(item.expected_time)}`;
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatClock(value: string | null) {
  if (!value) {
    return "--:--";
  }

  const [hours, minutes] = value.split(":");
  if (!hours || !minutes) {
    return value;
  }

  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatTimestamp(value: string) {
  return formatPhilippineDateTime(value);
}

function formatStatusLabel(status: TimeRequestRecord["status"]) {
  switch (status) {
    case "pending_manager_approval":
      return "Pending approval";
    case "pending_hr_review":
      return "Pending HR approval";
    case "approved":
      return "Approved";
    case "declined":
      return "Declined";
    case "returned":
      return "Declined";
  }
}

function buildReviewerLine(item: TimeRequestRecord) {
  if (item.status === "approved") {
    return `Approved by ${item.last_action_by_name ?? "HR"}`;
  }

  if (item.status === "declined" || item.status === "returned") {
    return `Declined by ${item.last_action_by_name ?? "Reviewer"}`;
  }

  if (item.status === "pending_hr_review") {
    return "Current approver: HR";
  }

  return item.reporting_manager_name_snapshot
    ? `Current approver: ${item.reporting_manager_name_snapshot} or HR`
    : "Current approver: HR";
}

function formatRequestPersonName(value: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return "Unknown requester";
  }

  const parts = normalizedValue.split(/\s+/);

  if (parts.length < 2) {
    return normalizedValue;
  }

  const surname = parts[parts.length - 1];
  const givenNames = parts.slice(0, -1).join(" ");

  return `${surname}, ${givenNames}`;
}

function getScheduleLabel(item: TimeRequestRecord) {
  if (item.form_kind === "leave") {
    return "From";
  }

  if (item.form_kind === "attendance") {
    return "For date";
  }

  return "Schedule";
}

function buildRequestExtraDetails(item: TimeRequestRecord) {
  const details: string[] = [];

  if (isMeaningfulRequestDetail(item.coverage_plan)) {
    details.push(`Coverage: ${item.coverage_plan}`);
  }

  if (isMeaningfulRequestDetail(item.location)) {
    details.push(`Location: ${item.location}`);
  }

  if (isMeaningfulRequestDetail(item.contact_person)) {
    details.push(`Contact person: ${item.contact_person}`);
  }

  if (isMeaningfulRequestDetail(item.attachment_label)) {
    details.push(`Document: ${item.attachment_label}`);
  }

  return details;
}

function isMeaningfulRequestDetail(value: string | null) {
  if (!value) {
    return false;
  }

  const normalizedValue = value.trim().toLowerCase();

  return !["n/a", "na", "none", "null", "-", "--", "not applicable"].includes(
    normalizedValue,
  );
}

function buildRequestActivityLine(item: TimeRequestRecord) {
  const details = [
    buildReviewerLine(item),
    item.approval_route,
    `Submitted ${formatTimestamp(item.created_at)}`,
  ];

  if (item.reviewed_at) {
    details.push(
      `${
        item.status === "approved"
          ? "Approved"
          : item.status === "declined" || item.status === "returned"
            ? "Declined"
            : "Updated"
      } ${formatTimestamp(item.reviewed_at)}`,
    );
  }

  return details.join(" | ");
}

function shortLabel(value: string) {
  return value
    .replace("Vacation Leave / Service Incentive Leave", "Vacation Leave")
    .replace("Missing Time-In / Time-Out Correction", "Missing Log")
    .replace("Official Business / Field Work", "Official Business");
}

function formatFormKind(value: RequestCatalogItem["formKind"]) {
  switch (value) {
    case "leave":
      return "Date-range leave filing";
    case "overtime":
      return "Work extension / payroll-impact filing";
    case "attendance":
      return "Attendance correction filing";
    case "arrangement":
      return "Schedule / work arrangement filing";
  }
}

function documentHint(selectedType: RequestCatalogItem) {
  if (selectedType.id === "sick-leave") {
    return "Medical certificate or consultation proof";
  }

  if (selectedType.id === "official-business") {
    return "Meeting details, itinerary, or assignment note";
  }

  if (selectedType.id === "missing-time-log" || selectedType.id === "dtr-adjustment") {
    return "Screenshot, log proof, or attendance explanation";
  }

  if (selectedType.formKind === "overtime") {
    return "Supervisor instruction, output note, or shift extension record";
  }

  if (selectedType.formKind === "leave") {
    return "Policy-based attachment when required";
  }

  return "Context note or internal support document";
}

function StepCard({
  step,
  title,
  description,
  active,
}: {
  step: string;
  title: string;
  description: string;
  active: boolean;
}) {
  return (
    <article
      className={
        active
          ? "rounded-2xl border border-slate-900 bg-slate-900 px-4 py-4 text-white"
          : "rounded-2xl border border-slate-200/80 bg-white px-4 py-4"
      }
    >
      <p
        className={
          active
            ? "text-xs font-semibold uppercase tracking-[0.18em] text-slate-200"
            : "text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
        }
      >
        Step {step}
      </p>
      <p className="mt-2 text-sm font-semibold">{title}</p>
      <p
        className={
          active
            ? "mt-2 text-sm leading-6 text-slate-200"
            : "mt-2 text-sm leading-6 text-slate-600"
        }
      >
        {description}
      </p>
    </article>
  );
}

function GuideRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function InfoRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "muted";
}) {
  return (
    <div className="text-sm leading-5 text-slate-700">
      <span className="mr-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}:
      </span>
      <span className={tone === "muted" ? "text-slate-600" : "text-slate-700"}>
        {value}
      </span>
    </div>
  );
}

function StatusPill({ status }: { status: TimeRequestRecord["status"] }) {
  return (
    <span
      className={
        status === "returned" || status === "declined"
          ? "inline-flex h-10 items-center justify-center rounded-2xl bg-rose-100 px-4 text-sm font-semibold text-rose-700"
          : status === "approved"
            ? "inline-flex h-10 items-center justify-center rounded-2xl bg-emerald-100 px-4 text-sm font-semibold text-emerald-700"
            : "inline-flex h-10 items-center justify-center rounded-2xl bg-amber-100 px-4 text-sm font-semibold text-amber-700"
      }
    >
      {formatStatusLabel(status)}
    </span>
  );
}
