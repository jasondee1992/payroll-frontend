import { parseBoolean, parseNumber, parseRecord, parseString } from "@/lib/api/parsers";
import { handleUnauthorizedClientResponse } from "@/lib/auth/client-auth";
import type { HolidayRecord } from "@/types/holidays";

export type HolidayPayload = {
  holiday_date: string;
  holiday_name: string;
  holiday_type: string;
  applies_nationally: boolean;
  applies_to_location?: string | null;
  is_paid: boolean;
  remarks?: string | null;
  active: boolean;
};

function parseOptionalString(value: unknown, label: string) {
  return parseString(value, label, { optional: true }) ?? null;
}

function getHolidayActionErrorMessage(responseBody: unknown) {
  if (typeof responseBody === "string" && responseBody.trim().length > 0) {
    return responseBody;
  }

  if (responseBody && typeof responseBody === "object") {
    if ("detail" in responseBody && typeof responseBody.detail === "string") {
      return responseBody.detail;
    }

    if ("error" in responseBody && typeof responseBody.error === "string") {
      return responseBody.error;
    }
  }

  return "Unable to complete the holiday calendar request.";
}

export function parseHolidayRecord(value: unknown): HolidayRecord {
  const record = parseRecord(value, "holiday");

  return {
    id: parseNumber(record.id, "holiday.id"),
    holiday_date: parseString(record.holiday_date, "holiday.holiday_date"),
    holiday_name: parseString(record.holiday_name, "holiday.holiday_name"),
    holiday_type: parseString(record.holiday_type, "holiday.holiday_type") as HolidayRecord["holiday_type"],
    applies_nationally: parseBoolean(
      record.applies_nationally,
      "holiday.applies_nationally",
    ),
    applies_to_location: parseOptionalString(
      record.applies_to_location,
      "holiday.applies_to_location",
    ),
    is_paid: parseBoolean(record.is_paid, "holiday.is_paid"),
    remarks: parseOptionalString(record.remarks, "holiday.remarks"),
    active: parseBoolean(record.active, "holiday.active"),
    created_at: parseString(record.created_at, "holiday.created_at"),
    updated_at: parseString(record.updated_at, "holiday.updated_at"),
  };
}

async function requestHolidayProxy<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT";
    body?: unknown;
    parser: (value: unknown) => T;
  },
) {
  const response = await fetch(`/api/holidays${path}`, {
    method: options.method ?? "GET",
    headers:
      options.body === undefined
        ? {
            Accept: "application/json",
          }
        : {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const responseBody = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (await handleUnauthorizedClientResponse(response)) {
    throw new Error("Your session has expired. Redirecting to login.");
  }

  if (!response.ok) {
    throw new Error(getHolidayActionErrorMessage(responseBody));
  }

  return options.parser(responseBody);
}

export async function getHolidays(filters: {
  year?: number;
  dateFrom?: string;
  dateTo?: string;
  holidayType?: string | null;
  appliesToLocation?: string | null;
  active?: boolean | null;
} = {}) {
  const searchParams = new URLSearchParams();

  if (filters.year != null) {
    searchParams.set("year", String(filters.year));
  }
  if (filters.dateFrom) {
    searchParams.set("date_from", filters.dateFrom);
  }
  if (filters.dateTo) {
    searchParams.set("date_to", filters.dateTo);
  }
  if (filters.holidayType) {
    searchParams.set("holiday_type", filters.holidayType);
  }
  if (filters.appliesToLocation) {
    searchParams.set("applies_to_location", filters.appliesToLocation);
  }
  if (filters.active != null) {
    searchParams.set("active", String(filters.active));
  }

  const suffix = searchParams.toString();

  return requestHolidayProxy(`${suffix ? `?${suffix}` : ""}`, {
    parser: (value) => {
      if (!Array.isArray(value)) {
        throw new Error("Invalid API response: expected holidays to be an array.");
      }

      return value.map((item) => parseHolidayRecord(item));
    },
  });
}

export async function createHoliday(payload: HolidayPayload) {
  return requestHolidayProxy("", {
    method: "POST",
    body: payload,
    parser: parseHolidayRecord,
  });
}

export async function updateHoliday(holidayId: number, payload: HolidayPayload) {
  return requestHolidayProxy(`/${holidayId}`, {
    method: "PUT",
    body: payload,
    parser: parseHolidayRecord,
  });
}

export async function deactivateHoliday(holidayId: number, remarks?: string) {
  return requestHolidayProxy(`/${holidayId}/deactivate`, {
    method: "POST",
    body: {
      remarks: remarks?.trim() || undefined,
    },
    parser: parseHolidayRecord,
  });
}
