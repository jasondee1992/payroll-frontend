import {
  parseNumber,
  parseRecord,
  parseString,
} from "@/lib/api/parsers";

export type TimeRequestScope = "mine" | "approvals" | "all";
export type TimeRequestAction = "approve" | "return";
export type TimeRequestStatus =
  | "pending_manager_approval"
  | "pending_hr_review"
  | "approved"
  | "returned";

export type TimeRequestRecord = {
  id: number;
  employee_id: number;
  submitted_by_user_id: number;
  reporting_manager_id: number | null;
  last_action_by_user_id: number | null;
  employee_code_snapshot: string;
  employee_name_snapshot: string;
  reporting_manager_name_snapshot: string | null;
  request_type_id: string;
  request_type_title: string;
  form_kind: string;
  status: TimeRequestStatus;
  approval_route: string;
  date_from: string | null;
  date_to: string | null;
  request_date: string | null;
  start_time: string | null;
  end_time: string | null;
  actual_time: string | null;
  expected_time: string | null;
  location: string | null;
  coverage_plan: string | null;
  reason: string;
  attachment_label: string | null;
  contact_person: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateTimeRequestPayload = {
  request_type_id: string;
  date_from?: string | null;
  date_to?: string | null;
  request_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  actual_time?: string | null;
  expected_time?: string | null;
  location?: string | null;
  coverage_plan?: string | null;
  reason: string;
  attachment_label?: string | null;
  contact_person?: string | null;
};

export type UpdateTimeRequestStatusPayload = {
  action: TimeRequestAction;
  note?: string | null;
};

function parseOptionalString(value: unknown, label: string) {
  return parseString(value, label, { optional: true }) ?? null;
}

export function parseTimeRequestRecord(value: unknown): TimeRequestRecord {
  const record = parseRecord(value, "time request");

  return {
    id: parseNumber(record.id, "timeRequest.id"),
    employee_id: parseNumber(record.employee_id, "timeRequest.employee_id"),
    submitted_by_user_id: parseNumber(
      record.submitted_by_user_id,
      "timeRequest.submitted_by_user_id",
    ),
    reporting_manager_id:
      record.reporting_manager_id == null
        ? null
        : parseNumber(
            record.reporting_manager_id,
            "timeRequest.reporting_manager_id",
          ),
    last_action_by_user_id:
      record.last_action_by_user_id == null
        ? null
        : parseNumber(
            record.last_action_by_user_id,
            "timeRequest.last_action_by_user_id",
          ),
    employee_code_snapshot: parseString(
      record.employee_code_snapshot,
      "timeRequest.employee_code_snapshot",
    ),
    employee_name_snapshot: parseString(
      record.employee_name_snapshot,
      "timeRequest.employee_name_snapshot",
    ),
    reporting_manager_name_snapshot: parseOptionalString(
      record.reporting_manager_name_snapshot,
      "timeRequest.reporting_manager_name_snapshot",
    ),
    request_type_id: parseString(
      record.request_type_id,
      "timeRequest.request_type_id",
    ),
    request_type_title: parseString(
      record.request_type_title,
      "timeRequest.request_type_title",
    ),
    form_kind: parseString(record.form_kind, "timeRequest.form_kind"),
    status: parseString(record.status, "timeRequest.status") as TimeRequestStatus,
    approval_route: parseString(
      record.approval_route,
      "timeRequest.approval_route",
    ),
    date_from: parseOptionalString(record.date_from, "timeRequest.date_from"),
    date_to: parseOptionalString(record.date_to, "timeRequest.date_to"),
    request_date: parseOptionalString(
      record.request_date,
      "timeRequest.request_date",
    ),
    start_time: parseOptionalString(record.start_time, "timeRequest.start_time"),
    end_time: parseOptionalString(record.end_time, "timeRequest.end_time"),
    actual_time: parseOptionalString(
      record.actual_time,
      "timeRequest.actual_time",
    ),
    expected_time: parseOptionalString(
      record.expected_time,
      "timeRequest.expected_time",
    ),
    location: parseOptionalString(record.location, "timeRequest.location"),
    coverage_plan: parseOptionalString(
      record.coverage_plan,
      "timeRequest.coverage_plan",
    ),
    reason: parseString(record.reason, "timeRequest.reason"),
    attachment_label: parseOptionalString(
      record.attachment_label,
      "timeRequest.attachment_label",
    ),
    contact_person: parseOptionalString(
      record.contact_person,
      "timeRequest.contact_person",
    ),
    review_note: parseOptionalString(
      record.review_note,
      "timeRequest.review_note",
    ),
    reviewed_at: parseOptionalString(
      record.reviewed_at,
      "timeRequest.reviewed_at",
    ),
    created_at: parseString(record.created_at, "timeRequest.created_at"),
    updated_at: parseString(record.updated_at, "timeRequest.updated_at"),
  };
}

function getTimeRequestErrorMessage(responseBody: unknown) {
  if (
    responseBody &&
    typeof responseBody === "object" &&
    !Array.isArray(responseBody)
  ) {
    if (
      "error" in responseBody &&
      typeof responseBody.error === "string" &&
      responseBody.error.trim().length > 0
    ) {
      return responseBody.error;
    }

    if (
      "detail" in responseBody &&
      typeof responseBody.detail === "string" &&
      responseBody.detail.trim().length > 0
    ) {
      return responseBody.detail;
    }
  }

  if (typeof responseBody === "string" && responseBody.trim().length > 0) {
    return responseBody;
  }

  return "Unable to process the time request.";
}

export async function getTimeRequests(scope: TimeRequestScope) {
  const response = await fetch(`/api/time-requests?scope=${scope}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") ?? "";
  const responseBody = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(getTimeRequestErrorMessage(responseBody));
  }

  if (!Array.isArray(responseBody)) {
    throw new Error("Invalid time request list response.");
  }

  return responseBody.map((item) => parseTimeRequestRecord(item));
}

export async function createTimeRequest(payload: CreateTimeRequestPayload) {
  const response = await fetch("/api/time-requests", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const responseBody = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(getTimeRequestErrorMessage(responseBody));
  }

  return parseTimeRequestRecord(responseBody);
}

export async function updateTimeRequestStatus(
  requestId: number,
  payload: UpdateTimeRequestStatusPayload,
) {
  const response = await fetch(`/api/time-requests/${requestId}/status`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const responseBody = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(getTimeRequestErrorMessage(responseBody));
  }

  return parseTimeRequestRecord(responseBody);
}
