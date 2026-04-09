import { apiClient } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import { loadApiResource } from "@/lib/api/resources";
import {
  parseCollection,
  parseNumber,
  parseRecord,
  parseString,
} from "@/lib/api/parsers";
import { parseDashboardValueRecord } from "@/lib/api/dashboard";
import type {
  ExceptionDashboardDetailRecord,
  ExceptionDashboardGroupRecord,
  ExceptionDashboardItemRecord,
  ExceptionDashboardRecord,
} from "@/types/exceptions";

function parseOptionalString(value: unknown, label: string) {
  return parseString(value, label, { optional: true }) ?? null;
}

export function parseExceptionDashboardDetailRecord(
  value: unknown,
): ExceptionDashboardDetailRecord {
  const record = parseRecord(value, "exception dashboard detail");

  return {
    key: parseString(record.key, "exceptionDashboardDetail.key"),
    label: parseString(record.label, "exceptionDashboardDetail.label"),
    description: parseOptionalString(
      record.description,
      "exceptionDashboardDetail.description",
    ),
    href: parseOptionalString(record.href, "exceptionDashboardDetail.href"),
  };
}

export function parseExceptionDashboardItemRecord(
  value: unknown,
): ExceptionDashboardItemRecord {
  const record = parseRecord(value, "exception dashboard item");

  return {
    key: parseString(record.key, "exceptionDashboardItem.key"),
    title: parseString(record.title, "exceptionDashboardItem.title"),
    description: parseString(record.description, "exceptionDashboardItem.description"),
    severity: parseString(record.severity, "exceptionDashboardItem.severity") as ExceptionDashboardItemRecord["severity"],
    affected_count: parseNumber(
      record.affected_count,
      "exceptionDashboardItem.affected_count",
    ),
    href: parseOptionalString(record.href, "exceptionDashboardItem.href"),
    details: parseCollection(
      record.details ?? [],
      (item) => parseExceptionDashboardDetailRecord(item),
      "exceptionDashboardItem.details",
    ),
  };
}

export function parseExceptionDashboardGroupRecord(
  value: unknown,
): ExceptionDashboardGroupRecord {
  const record = parseRecord(value, "exception dashboard group");

  return {
    key: parseString(record.key, "exceptionDashboardGroup.key"),
    title: parseString(record.title, "exceptionDashboardGroup.title"),
    description: parseString(record.description, "exceptionDashboardGroup.description"),
    severity: parseString(record.severity, "exceptionDashboardGroup.severity") as ExceptionDashboardGroupRecord["severity"],
    total_affected: parseNumber(
      record.total_affected,
      "exceptionDashboardGroup.total_affected",
    ),
    open_item_count: parseNumber(
      record.open_item_count,
      "exceptionDashboardGroup.open_item_count",
    ),
    items: parseCollection(
      record.items ?? [],
      (item) => parseExceptionDashboardItemRecord(item),
      "exceptionDashboardGroup.items",
    ),
  };
}

export function parseExceptionDashboardRecord(
  value: unknown,
): ExceptionDashboardRecord {
  const record = parseRecord(value, "exception dashboard");

  return {
    generated_at: parseString(record.generated_at, "exceptionDashboard.generated_at"),
    summary_metrics: parseCollection(
      record.summary_metrics ?? [],
      (item) => parseDashboardValueRecord(item),
      "exceptionDashboard.summary_metrics",
    ),
    groups: parseCollection(
      record.groups ?? [],
      (item) => parseExceptionDashboardGroupRecord(item),
      "exceptionDashboard.groups",
    ),
  };
}

export async function getExceptionDashboard() {
  return apiClient.get<ExceptionDashboardRecord, ExceptionDashboardRecord>(
    apiEndpoints.dashboard.exceptions,
    {
      parser: parseExceptionDashboardRecord,
    },
  );
}

export async function getExceptionDashboardResource() {
  return loadApiResource(() => getExceptionDashboard(), {
    fallbackData: null,
    errorMessage: "Unable to load the exception dashboard from the backend.",
  });
}
