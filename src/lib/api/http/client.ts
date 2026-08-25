// File responsibility: lightweight HTTP client for the FractionalLuxe API.
// Handles JSON serialization, Bearer auth, error mapping, query building, and 401 signal.
import { triggerAuthInvalidated } from "@/lib/api/auth-events";
import { setApiAccessToken } from "@/lib/api/session-token";

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export interface HttpClient {
  get<T>(path: string, query?: Record<string, string | undefined>): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  patch<T>(path: string, body?: unknown): Promise<T>;
  delete(path: string): Promise<void>;
  getText(path: string): Promise<string>;
}

export function createHttpClient(opts: {
  baseUrl: string;
  getToken: () => string | null;
}): HttpClient {
  const base = opts.baseUrl.replace(/\/+$/, "");

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (body !== undefined && method !== "DELETE") {
      headers["Content-Type"] = "application/json";
    }
    const token = opts.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "omit",
    });

    if (res.status === 204) {
      return undefined as T;
    }

    if (!res.ok) {
      if (res.status === 401) {
        setApiAccessToken(null);
        triggerAuthInvalidated();
      }
      let code: string | undefined;
      let message = res.statusText;
      try {
        const err = (await res.json()) as { code?: string; message?: string };
        code = err.code;
        if (err.message) message = err.message;
      } catch {
        // Non-JSON error body — use status text.
      }
      throw new ApiError(res.status, message, code);
    }

    return (await res.json()) as T;
  }

  function buildUrl(path: string, query?: Record<string, string | undefined>): string {
    if (!query) return path;
    const params = Object.entries(query)
      .filter(([, v]) => v != null && v !== "")
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`)
      .join("&");
    return params ? `${path}?${params}` : path;
  }

  async function requestText(method: string, path: string): Promise<string> {
    const headers: Record<string, string> = { Accept: "text/csv" };
    const token = opts.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch(`${base}${path}`, { method, headers, credentials: "omit" });
    if (!res.ok) {
      if (res.status === 401) {
        setApiAccessToken(null);
        triggerAuthInvalidated();
      }
      let message = res.statusText;
      try {
        const err = (await res.json()) as { message?: string };
        if (err.message) message = err.message;
      } catch { /* ignore */ }
      throw new ApiError(res.status, message);
    }
    return res.text();
  }

  return {
    get<T>(path: string, query?: Record<string, string | undefined>): Promise<T> {
      return request<T>("GET", buildUrl(path, query));
    },
    post<T>(path: string, body?: unknown): Promise<T> {
      return request<T>("POST", path, body);
    },
    patch<T>(path: string, body?: unknown): Promise<T> {
      return request<T>("PATCH", path, body);
    },
    delete(path: string): Promise<void> {
      return request<void>("DELETE", path);
    },
    getText(path: string): Promise<string> {
      return requestText("GET", path);
    },
  };
}
