"use client";

import { FormEvent, useMemo, useState } from "react";
import { SectionCard } from "@/components/ui/section-card";
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

type SubmittedRequest = {
  reference: string;
  typeTitle: string;
  status: string;
  dateSummary: string;
  submittedAt: string;
  approvalPath: string;
  managerName: string;
};

const quickPickIds = [
  "vacation-leave",
  "sick-leave",
  "overtime",
  "undertime",
  "missing-time-log",
  "official-business",
];

const initialQueue: SubmittedRequest[] = [
  {
    reference: "TR-2026-041",
    typeTitle: "Vacation Leave / Service Incentive Leave",
    status: "Pending HR review",
    dateSummary: "Apr 18, 2026 to Apr 19, 2026",
    submittedAt: "Today, 9:10 AM",
    approvalPath: "Immediate lead -> HR",
    managerName: "Maria Santos",
  },
  {
    reference: "TR-2026-038",
    typeTitle: "Overtime",
    status: "For supervisor approval",
    dateSummary: "Apr 3, 2026, 6:00 PM to 8:30 PM",
    submittedAt: "Today, 6:12 PM",
    approvalPath: "Immediate lead -> Attendance/HR -> Payroll",
    managerName: "Carlo Reyes",
  },
];

export function RequestFilingWorkspace() {
  const [selectedTypeId, setSelectedTypeId] = useState(allRequestTypes[0]?.id ?? "");
  const selectedType =
    allRequestTypes.find((item) => item.id === selectedTypeId) ?? allRequestTypes[0];
  const [formState, setFormState] = useState<FilingFormState>(createEmptyFormState());
  const [submittedRequests, setSubmittedRequests] =
    useState<SubmittedRequest[]>(initialQueue);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const currentStep = useMemo(() => {
    if (!selectedType) {
      return 1;
    }

    if (hasRequiredValues(selectedType, formState)) {
      return 3;
    }

    return formState.reason.trim() ? 2 : 1;
  }, [formState, selectedType]);

  if (!selectedType) {
    return null;
  }

  function handleRequestTypeChange(nextTypeId: string) {
    setSelectedTypeId(nextTypeId);
    setFormState(createEmptyFormState());
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const validationError = validateForm(selectedType, formState);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const entry: SubmittedRequest = {
      reference: `TR-${new Date().getFullYear()}-${String(submittedRequests.length + 42).padStart(3, "0")}`,
      typeTitle: selectedType.title,
      status: "For approval",
      dateSummary: buildDateSummary(selectedType, formState),
      submittedAt: formatTimestamp(new Date()),
      approvalPath: selectedType.approvalPath,
      managerName: formState.managerName.trim() || "Waiting for manager assignment",
    };

    setSubmittedRequests((current) => [entry, ...current]);
    setFormState(createEmptyFormState());
    setSuccessMessage(
      `Sample ${selectedType.title} request created and added to the local queue.`,
    );
  }

  const quickPicks = allRequestTypes.filter((item) => quickPickIds.includes(item.id));

  return (
    <SectionCard
      title="Request filing process"
      description="Use this sample workflow to file leave, overtime, attendance corrections, and work arrangement requests from one screen."
    >
      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="space-y-4">
          <div className="rounded-[26px] border border-amber-200/80 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
            Demo flow only. Submissions below stay in frontend state until a dedicated backend request module is wired.
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
              title="Submit sample"
              active={currentStep === 3}
              description="Review the approval route and add the request to the demo queue."
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
                  <input
                    type="text"
                    value={formState.managerName}
                    onChange={(event) =>
                      handleFieldChange("managerName", event.target.value)
                    }
                    className="ui-input"
                    placeholder="Example: Maria Santos"
                  />
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
                  value={formState.managerName.trim() || "Waiting for manager assignment"}
                />
                <ReviewItem
                  label="Schedule summary"
                  value={buildDateSummary(selectedType, formState)}
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
                    setFormState(createEmptyFormState());
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="ui-button-secondary"
                >
                  Reset form
                </button>
                <button type="submit" className="ui-button-primary">
                  Submit sample request
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

          <div className="rounded-[26px] border border-slate-200/80 bg-white px-5 py-5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 pb-4">
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  Demo submission queue
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Recently filed sample requests inside this page session.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                {submittedRequests.length} items
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {submittedRequests.map((item) => (
                <article
                  key={item.reference}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {item.typeTitle}
                      </p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {item.reference}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                    <p>{item.dateSummary}</p>
                    <p>Manager: {item.managerName}</p>
                    <p>{item.approvalPath}</p>
                    <p>{item.submittedAt}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function createEmptyFormState(): FilingFormState {
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
    managerName: "Maria Santos",
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
    return "Add the request reason before submitting the sample entry.";
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

function buildDateSummary(
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

function formatTimestamp(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
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
