import {
  parseBoolean,
  parseCollection,
  parseNumber,
  parseRecord,
  parseString,
} from "@/lib/api/parsers";
import { handleUnauthorizedClientResponse } from "@/lib/auth/client-auth";
import type {
  NotificationMarkAllResult,
  NotificationRecord,
} from "@/types/notifications";

function parseOptionalString(value: unknown, label: string) {
  return parseString(value, label, { optional: true }) ?? null;
}

export function parseNotificationRecord(value: unknown): NotificationRecord {
  const record = parseRecord(value, "notification");

  return {
    id: parseNumber(record.id, "notification.id"),
    notification_type: parseString(record.notification_type, "notification.notification_type"),
    title: parseString(record.title, "notification.title"),
    message: parseString(record.message, "notification.message"),
    category: parseString(record.category, "notification.category"),
    severity: parseString(record.severity, "notification.severity"),
    href: parseString(record.href, "notification.href"),
    entity_type: parseOptionalString(record.entity_type, "notification.entity_type"),
    entity_id:
      record.entity_id == null
        ? null
        : parseNumber(record.entity_id, "notification.entity_id"),
    is_read: parseBoolean(record.is_read, "notification.is_read"),
    read_at: parseOptionalString(record.read_at, "notification.read_at"),
    created_at: parseString(record.created_at, "notification.created_at"),
    updated_at: parseString(record.updated_at, "notification.updated_at"),
  };
}

function parseNotificationMarkAllResult(value: unknown): NotificationMarkAllResult {
  const record = parseRecord(value, "notification mark all result");

  return {
    marked_count: parseNumber(record.marked_count, "notificationMarkAllResult.marked_count"),
  };
}

async function getResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json")
    ? response.json()
    : response.text();
}

function getErrorMessage(responseBody: unknown) {
  if (
    responseBody &&
    typeof responseBody === "object" &&
    !Array.isArray(responseBody)
  ) {
    if ("error" in responseBody && typeof responseBody.error === "string") {
      return responseBody.error;
    }

    if ("detail" in responseBody && typeof responseBody.detail === "string") {
      return responseBody.detail;
    }
  }

  if (typeof responseBody === "string" && responseBody.trim().length > 0) {
    return responseBody;
  }

  return "Unable to process the notifications request.";
}

async function handleApiResponse<T>(response: Response, parse: (value: unknown) => T) {
  const responseBody = await getResponseBody(response);

  if (await handleUnauthorizedClientResponse(response)) {
    throw new Error("Your session has expired. Redirecting to login.");
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(responseBody));
  }

  return parse(responseBody);
}

export async function getNotifications() {
  const response = await fetch("/api/notifications", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  return handleApiResponse(response, (value) =>
    parseCollection(
      value,
      (item) => parseNotificationRecord(item),
      "notifications",
    ),
  );
}

export async function markNotificationAsRead(notificationId: number) {
  const response = await fetch(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ is_read: true }),
  });

  return handleApiResponse(response, parseNotificationRecord);
}

export async function markAllNotificationsAsRead() {
  const response = await fetch("/api/notifications/read-all", {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
  });

  return handleApiResponse(response, parseNotificationMarkAllResult);
}
