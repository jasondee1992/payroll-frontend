import { getApiBaseUrl } from "@/lib/api/config";

type QueryValue = string | number | boolean | undefined;
type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiFetchOptions = {
  revalidate?: number | false;
  tags?: string[];
};

export type ApiQueryParams = Record<string, QueryValue>;
export type ApiResponseParser<TParsed> = (response: unknown) => TParsed;

export type ApiRequestOptions<TParsed = unknown> = {
  method?: ApiMethod;
  query?: ApiQueryParams;
  headers?: HeadersInit;
  body?: unknown;
  signal?: AbortSignal;
  cache?: RequestCache;
  next?: ApiFetchOptions;
  parser?: ApiResponseParser<TParsed>;
};

export type ApiClientConfig = {
  baseUrl?: string;
  defaultHeaders?: HeadersInit;
};

export class ApiClientError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown = null) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

export function getApiErrorMessage(
  error: unknown,
  fallbackMessage = "Unable to load data from the backend.",
) {
  if (isApiClientError(error)) {
    if (typeof error.details === "string" && error.details.trim().length > 0) {
      return error.details;
    }

    if (
      error.details &&
      typeof error.details === "object" &&
      "detail" in error.details
    ) {
      const detail = (error.details as Record<string, unknown>).detail;

      if (typeof detail === "string" && detail.trim().length > 0) {
        return detail;
      }
    }

    if (
      error.details &&
      typeof error.details === "object" &&
      "error" in error.details
    ) {
      const detail = (error.details as Record<string, unknown>).error;

      if (typeof detail === "string" && detail.trim().length > 0) {
        return detail;
      }
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallbackMessage;
}

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

function mergeHeaders(
  defaultHeaders: HeadersInit | undefined,
  requestHeaders: HeadersInit | undefined,
  hasBody: boolean,
) {
  const headers = new Headers(defaultHeaders);

  headers.set("Accept", "application/json");

  if (hasBody) {
    headers.set("Content-Type", "application/json");
  }

  if (requestHeaders) {
    for (const [key, value] of new Headers(requestHeaders).entries()) {
      headers.set(key, value);
    }
  }

  return headers;
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
    async request<TResponse, TParsed = TResponse>(
      path: string,
      options: ApiRequestOptions<TParsed> = {},
    ): Promise<TParsed> {
      if (!baseUrl) {
        throw new Error(
          "NEXT_PUBLIC_API_URL is not configured. Set it before calling the backend.",
        );
      }

      const url = this.buildUrl(path, options.query);
      const headers = mergeHeaders(
        defaultHeaders,
        options.headers,
        options.body !== undefined,
      );

      const response = await fetch(url, {
        method: options.method ?? "GET",
        headers,
        body:
          options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: options.signal,
        cache: options.cache ?? "no-store",
        next: options.next,
      });

      const contentType = response.headers.get("content-type") ?? "";
      const responseBody = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        throw new ApiClientError(
          `Backend request failed with status ${response.status}.`,
          response.status,
          responseBody,
        );
      }

      if (options.parser) {
        return options.parser(responseBody);
      }

      return responseBody as TParsed;
    },
    get<TResponse, TParsed = TResponse>(
      path: string,
      options: Omit<ApiRequestOptions<TParsed>, "method"> = {},
    ) {
      return this.request<TResponse, TParsed>(path, {
        ...options,
        method: "GET",
      });
    },
    post<TResponse, TParsed = TResponse>(
      path: string,
      options: Omit<ApiRequestOptions<TParsed>, "method"> = {},
    ) {
      return this.request<TResponse, TParsed>(path, {
        ...options,
        method: "POST",
      });
    },
    put<TResponse, TParsed = TResponse>(
      path: string,
      options: Omit<ApiRequestOptions<TParsed>, "method"> = {},
    ) {
      return this.request<TResponse, TParsed>(path, {
        ...options,
        method: "PUT",
      });
    },
    patch<TResponse, TParsed = TResponse>(
      path: string,
      options: Omit<ApiRequestOptions<TParsed>, "method"> = {},
    ) {
      return this.request<TResponse, TParsed>(path, {
        ...options,
        method: "PATCH",
      });
    },
    delete<TResponse, TParsed = TResponse>(
      path: string,
      options: Omit<ApiRequestOptions<TParsed>, "method"> = {},
    ) {
      return this.request<TResponse, TParsed>(path, {
        ...options,
        method: "DELETE",
      });
    },
  };
}

export const apiClient = createApiClient();
