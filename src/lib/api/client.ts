import { getApiBaseUrl } from "@/lib/api/config";

type QueryValue = string | number | boolean | undefined;

export type ApiQueryParams = Record<string, QueryValue>;

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: ApiQueryParams;
  headers?: HeadersInit;
  body?: unknown;
  signal?: AbortSignal;
};

export type ApiClientConfig = {
  baseUrl?: string;
  defaultHeaders?: HeadersInit;
};

function buildQueryString(query?: ApiQueryParams) {
  if (!query) {
    return "";
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const serialized = searchParams.toString();

  return serialized ? `?${serialized}` : "";
}

export function buildApiUrl(path: string, query?: ApiQueryParams) {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}${buildQueryString(query)}`;
}

export function createApiClient(config: ApiClientConfig = {}) {
  const baseUrl = config.baseUrl ?? getApiBaseUrl();
  const defaultHeaders = config.defaultHeaders ?? {};

  return {
    baseUrl,
    defaultHeaders,
    buildUrl(path: string, query?: ApiQueryParams) {
      const normalizedPath = path.startsWith("/") ? path : `/${path}`;
      return `${baseUrl}${normalizedPath}${buildQueryString(query)}`;
    },
    async request<T>(path: string, options?: ApiRequestOptions): Promise<T> {
      void path;
      void options;
      throw new Error(
        "API client is not wired yet. Connect this client when FastAPI endpoints are available.",
      );
    },
  };
}

export const apiClient = createApiClient();
