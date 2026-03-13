import { getAccessToken, setAccessToken } from "./auth";
import type { ApiError } from "@shared/types";

type FetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

class ApiClient {
  private refreshPromise: Promise<boolean> | null = null;

  async fetch<T>(url: string, options: FetchOptions = {}): Promise<T> {
    const response = await this.makeRequest(url, options);

    if (response.status === 401) {
      // Attempt one refresh and retry
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        const retry = await this.makeRequest(url, options);
        if (!retry.ok) {
          const err = await retry.json().catch(() => ({ message: "Request failed" }));
          throw new ApiRequestError(retry.status, err.message);
        }
        return retry.json();
      }
      throw new ApiRequestError(401, "Authentication required");
    }

    if (!response.ok) {
      const err: ApiError = await response.json().catch(() => ({
        message: "Request failed",
      }));
      throw new ApiRequestError(response.status, err.message);
    }

    // Handle empty responses (204, etc.)
    const text = await response.text();
    if (!text) return undefined as T;
    return JSON.parse(text);
  }

  private makeRequest(url: string, options: FetchOptions): Promise<Response> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    const token = getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return globalThis.fetch(url, {
      ...options,
      headers,
      credentials: "include",
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  }

  private async tryRefresh(): Promise<boolean> {
    // Deduplicate concurrent refresh attempts
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      try {
        const res = await globalThis.fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok) return false;

        const data = await res.json();
        setAccessToken(data.accessToken);
        return true;
      } catch {
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }
}

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export const api = new ApiClient();
