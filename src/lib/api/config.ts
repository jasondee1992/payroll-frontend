const configuredApiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL?.trim() ??
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ??
  "";

export const API_BASE_URL = configuredApiBaseUrl;

export function getApiBaseUrl() {
  return API_BASE_URL;
}
