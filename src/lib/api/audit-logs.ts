import { handleUnauthorizedClientResponse } from "@/lib/auth/client-auth";
import { parseCollection, parseNumber, parseRecord, parseString } from "@/lib/api/parsers";
import type { AuditLogActorRecord, AuditLogRecord } from "@/types/audit-log";

function parseOptionalNumber(value: unknown, label: string) {
  if (value == null) {
    return null;
  }

  return parseNumber(value, label);
}

function parseOptionalString(value: unknown, label: string) {
  if (value == null) {
    return null;
  }

  return parseString(value, label);
}

function parseAuditLogActorRecord(value: unknown): AuditLogActorRecord {
  const record = parseRecord(value, "audit log actor");

  return {
    id: parseNumber(record.id, "auditLogActor.id"),
    username: parseString(record.username, "auditLogActor.username"),
    email: parseString(record.email, "auditLogActor.email"),
    role: parseString(record.role, "auditLogActor.role"),
    first_name: parseOptionalString(record.first_name, "auditLogActor.first_name"),
    last_name: parseOptionalString(record.last_name, "auditLogActor.last_name"),
  };
}

export function parseAuditLogRecord(value: unknown): AuditLogRecord {
  const record = parseRecord(value, "audit log");

  return {
    id: parseNumber(record.id, "auditLog.id"),
    actor_user_id: parseOptionalNumber(record.actor_user_id, "auditLog.actor_user_id"),
    actor_role: parseOptionalString(record.actor_role, "auditLog.actor_role"),
    action_type: parseString(record.action_type, "auditLog.action_type"),
    module: parseString(record.module, "auditLog.module"),
    entity_type: parseString(record.entity_type, "auditLog.entity_type"),
    entity_id: parseOptionalNumber(record.entity_id, "auditLog.entity_id"),
    summary: parseString(record.summary, "auditLog.summary"),
    previous_value: record.previous_value ?? null,
    new_value: record.new_value ?? null,
    metadata: record.metadata ?? null,
    created_at: parseString(record.created_at, "auditLog.created_at"),
    actor_user:
      record.actor_user == null ? null : parseAuditLogActorRecord(record.actor_user),
  };
}

function getAuditLogErrorMessage(responseBody: unknown) {
  if (
    responseBody &&
    typeof responseBody === "object" &&
    "detail" in responseBody &&
    typeof responseBody.detail === "string"
  ) {
    return responseBody.detail;
  }

  if (
    responseBody &&
    typeof responseBody === "object" &&
    "error" in responseBody &&
    typeof responseBody.error === "string"
  ) {
    return responseBody.error;
  }

  return "Unable to load audit logs.";
}

export async function getAuditLogs(filters: {
  dateFrom?: string | null;
  dateTo?: string | null;
  module?: string | null;
  actionType?: string | null;
  actor?: string | null;
  entityType?: string | null;
} = {}) {
  const query = new URLSearchParams();

  if (filters.dateFrom) {
    query.set("date_from", filters.dateFrom);
  }
  if (filters.dateTo) {
    query.set("date_to", filters.dateTo);
  }
  if (filters.module) {
    query.set("module", filters.module);
  }
  if (filters.actionType) {
    query.set("action_type", filters.actionType);
  }
  if (filters.actor) {
    query.set("actor", filters.actor.trim());
  }
  if (filters.entityType) {
    query.set("entity_type", filters.entityType);
  }

  const suffix = query.toString();
  const response = await fetch(`/api/audit-logs${suffix ? `?${suffix}` : ""}`, {
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

  if (await handleUnauthorizedClientResponse(response)) {
    throw new Error("Your session has expired. Redirecting to login.");
  }

  if (!response.ok) {
    throw new Error(getAuditLogErrorMessage(responseBody));
  }

  return parseCollection(
    responseBody,
    (item) => parseAuditLogRecord(item),
    "audit logs",
  );
}
