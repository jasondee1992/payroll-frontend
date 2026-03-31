import { getApiBaseUrl } from "@/lib/api/config";

const BACKEND_HEALTH_PATH = "/api/v1/health";
const BACKEND_HEALTH_TIMEOUT_MS = 1500;

export type BackendStatus = {
  available: boolean;
  message: string | null;
};

export async function getBackendStatus(): Promise<BackendStatus> {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return {
      available: false,
      message: "Backend URL is not configured.",
    };
  }

  try {
    const response = await fetch(`${apiBaseUrl}${BACKEND_HEALTH_PATH}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(BACKEND_HEALTH_TIMEOUT_MS),
    });

    if (!response.ok) {
      return {
        available: false,
        message: `Backend health check failed with status ${response.status}.`,
      };
    }

    return {
      available: true,
      message: null,
    };
  } catch {
    return {
      available: false,
      message: `Backend is offline or unreachable at ${apiBaseUrl}.`,
    };
  }
}
