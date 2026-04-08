import { apiClient } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import { loadApiResource } from "@/lib/api/resources";
import {
  parseCollection,
  parseRecord,
  parseString,
} from "@/lib/api/parsers";
import type {
  DashboardActivityRecord,
  DashboardAlertRecord,
  DashboardSectionRecord,
  DashboardSnapshotRecord,
  DashboardTone,
  DashboardValueRecord,
  DashboardValueType,
} from "@/types/dashboard";

function parseDashboardTone(value: unknown, label: string): DashboardTone {
  return parseString(value, label) as DashboardTone;
}

function parseDashboardValueType(
  value: unknown,
  label: string,
): DashboardValueType {
  return parseString(value, label) as DashboardValueType;
}

function parseOptionalString(value: unknown, label: string) {
  return parseString(value, label, { optional: true }) ?? null;
}

export function parseDashboardValueRecord(value: unknown): DashboardValueRecord {
  const record = parseRecord(value, "dashboard value");

  return {
    key: parseString(record.key, "dashboardValue.key"),
    label: parseString(record.label, "dashboardValue.label"),
    value: parseString(record.value, "dashboardValue.value"),
    value_type: parseDashboardValueType(
      record.value_type,
      "dashboardValue.value_type",
    ),
    context: parseOptionalString(record.context, "dashboardValue.context"),
    tone: parseDashboardTone(record.tone, "dashboardValue.tone"),
  };
}

export function parseDashboardAlertRecord(value: unknown): DashboardAlertRecord {
  const record = parseRecord(value, "dashboard alert");

  return {
    key: parseString(record.key, "dashboardAlert.key"),
    title: parseString(record.title, "dashboardAlert.title"),
    description: parseString(record.description, "dashboardAlert.description"),
    tone: parseDashboardTone(record.tone, "dashboardAlert.tone"),
  };
}

export function parseDashboardActivityRecord(
  value: unknown,
): DashboardActivityRecord {
  const record = parseRecord(value, "dashboard activity");

  return {
    key: parseString(record.key, "dashboardActivity.key"),
    title: parseString(record.title, "dashboardActivity.title"),
    description: parseString(record.description, "dashboardActivity.description"),
    occurred_at: parseOptionalString(
      record.occurred_at,
      "dashboardActivity.occurred_at",
    ),
    status_label: parseOptionalString(
      record.status_label,
      "dashboardActivity.status_label",
    ),
    status_tone:
      parseOptionalString(record.status_tone, "dashboardActivity.status_tone") as
        | DashboardTone
        | null,
  };
}

export function parseDashboardSectionRecord(value: unknown): DashboardSectionRecord {
  const record = parseRecord(value, "dashboard section");

  return {
    key: parseString(record.key, "dashboardSection.key"),
    title: parseString(record.title, "dashboardSection.title"),
    description: parseString(record.description, "dashboardSection.description"),
    variant: parseString(record.variant, "dashboardSection.variant") as DashboardSectionRecord["variant"],
    items: parseCollection(
      record.items ?? [],
      (item) => parseDashboardValueRecord(item),
      "dashboardSection.items",
    ),
    activities: parseCollection(
      record.activities ?? [],
      (item) => parseDashboardActivityRecord(item),
      "dashboardSection.activities",
    ),
    empty_title: parseOptionalString(
      record.empty_title,
      "dashboardSection.empty_title",
    ),
    empty_description: parseOptionalString(
      record.empty_description,
      "dashboardSection.empty_description",
    ),
  };
}

export function parseDashboardSnapshotRecord(
  value: unknown,
): DashboardSnapshotRecord {
  const record = parseRecord(value, "dashboard snapshot");

  return {
    role: parseString(record.role, "dashboardSnapshot.role") as DashboardSnapshotRecord["role"],
    title: parseString(record.title, "dashboardSnapshot.title"),
    description: parseString(record.description, "dashboardSnapshot.description"),
    generated_at: parseString(
      record.generated_at,
      "dashboardSnapshot.generated_at",
    ),
    summary_metrics: parseCollection(
      record.summary_metrics ?? [],
      (item) => parseDashboardValueRecord(item),
      "dashboardSnapshot.summary_metrics",
    ),
    alerts: parseCollection(
      record.alerts ?? [],
      (item) => parseDashboardAlertRecord(item),
      "dashboardSnapshot.alerts",
    ),
    sections: parseCollection(
      record.sections ?? [],
      (item) => parseDashboardSectionRecord(item),
      "dashboardSnapshot.sections",
    ),
  };
}

export async function getDashboardSnapshot() {
  return apiClient.get<DashboardSnapshotRecord, DashboardSnapshotRecord>(
    apiEndpoints.dashboard.summary,
    {
      parser: parseDashboardSnapshotRecord,
    },
  );
}

export async function getDashboardSnapshotResource() {
  return loadApiResource(() => getDashboardSnapshot(), {
    fallbackData: null,
    errorMessage: "Unable to load the dashboard snapshot from the backend.",
  });
}
