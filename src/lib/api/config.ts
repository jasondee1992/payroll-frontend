const configuredApiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL?.trim() ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  "";

const defaultDevelopmentApiBaseUrl =
  process.env.NODE_ENV === "production" ? "" : "http://127.0.0.1:8000";

export const API_BASE_URL = configuredApiBaseUrl || defaultDevelopmentApiBaseUrl;

export function getApiBaseUrl() {
  return API_BASE_URL;
}
