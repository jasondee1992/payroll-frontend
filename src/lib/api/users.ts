import { apiClient } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import { createCollectionParser, loadApiResource } from "@/lib/api/resources";
import {
  parseBoolean,
  parseNumber,
  parseRecord,
  parseString,
} from "@/lib/api/parsers";
import type { UserApiRecord } from "@/types/user";

export type UserUpdatePayload = {
  username?: string;
  email?: string;
  password?: string;
  role?: string;
  is_active?: boolean;
  must_change_password?: boolean;
  employee_id?: number | null;
};

export function parseUserRecord(value: unknown): UserApiRecord {
  const record = parseRecord(value, "user");

  return {
    id: parseNumber(record.id, "user.id"),
    username: parseString(record.username, "user.username"),
    email: parseString(record.email, "user.email"),
    role: parseString(record.role, "user.role"),
    is_active: parseBoolean(record.is_active, "user.is_active"),
    employee_id:
      record.employee_id == null
        ? undefined
        : parseNumber(record.employee_id, "user.employee_id"),
    created_at: parseString(record.created_at, "user.created_at"),
    updated_at: parseString(record.updated_at, "user.updated_at"),
  };
}

const parseUsersResponse = createCollectionParser({
  label: "users",
  parseItem: (record: unknown) => parseUserRecord(record),
});

export async function getUserRecords() {
  return apiClient.get<UserApiRecord[], UserApiRecord[]>(apiEndpoints.users.list, {
    parser: parseUsersResponse,
  });
}

export async function getUserRecordsResource() {
  return loadApiResource(() => getUserRecords(), {
    fallbackData: [],
    errorMessage: "Unable to load users from the backend.",
  });
}

function getUserUpdateErrorMessage(responseBody: unknown) {
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

  return "Unable to update the linked user account.";
}

export async function updateUserAccount(
  userId: number,
  payload: UserUpdatePayload,
) {
  const response = await fetch(`/api/users/${userId}`, {
    method: "PUT",
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
    throw new Error(getUserUpdateErrorMessage(responseBody));
  }

  return parseUserRecord(responseBody);
}
