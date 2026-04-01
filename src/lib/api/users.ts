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
