// Typed HTTP client for the LearnSphere API.
// Access token is stored in memory (closure) — NEVER in localStorage.
// The client automatically attaches the Authorization header and handles
// 401 responses by triggering a single-flight token refresh with retry.

import type { ApiError } from '../types';

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

type TokenRefresher = () => Promise<string | null>;
type SessionExpiredListener = () => void;

class ApiClient {
  private accessToken: string | null = null;
  private refresher: TokenRefresher | null = null;
  private refreshPromise: Promise<string | null> | null = null;
  private sessionExpiredListeners: Set<SessionExpiredListener> = new Set();

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  setRefresher(fn: TokenRefresher): void {
    this.refresher = fn;
  }

  onSessionExpired(listener: SessionExpiredListener): () => void {
    this.sessionExpiredListeners.add(listener);
    return () => {
      this.sessionExpiredListeners.delete(listener);
    };
  }

  private notifySessionExpired(): void {
    for (const listener of this.sessionExpiredListeners) {
      try {
        listener();
      } catch (e) {
        console.error('Error in session expired listener', e);
      }
    }
  }

  /**
   * Single-flight token refresh:
   * Coalesces concurrent calls so that only one /api/v1/auth/refresh HTTP request
   * is made regardless of how many requests trigger a 401 or bootstrap simultaneously.
   */
  async refreshAuthToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        // If a custom refresher was injected, use it; otherwise make direct fetch
        if (this.refresher) {
          const token = await this.refresher();
          if (token) {
            this.accessToken = token;
            return token;
          }
          this.accessToken = null;
          this.notifySessionExpired();
          return null;
        }

        const response = await fetch('/api/v1/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          this.accessToken = null;
          this.notifySessionExpired();
          return null;
        }

        const body = await response.json();
        const token = body?.data?.accessToken ?? null;
        if (token) {
          this.accessToken = token;
          return token;
        } else {
          this.accessToken = null;
          this.notifySessionExpired();
          return null;
        }
      } catch {
        this.accessToken = null;
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async getHeaders(includeAuth = true): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (includeAuth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');
    const body = isJson ? await response.json() : null;

    if (response.ok) {
      return body as T;
    }

    const err = body as ApiError;
    throw new ApiClientError(
      err?.error?.code ?? 'UNKNOWN_ERROR',
      err?.error?.message ?? `HTTP ${response.status}`,
      response.status,
      err?.error?.details,
    );
  }

  async request<T>(
    path: string,
    options: RequestInit & { skipAuth?: boolean; _retry?: boolean } = {},
  ): Promise<T> {
    const { skipAuth = false, _retry = false, ...fetchOptions } = options;
    const url = path.startsWith('http') ? path : path;

    const makeRequest = async (): Promise<Response> => {
      const headers = await this.getHeaders(!skipAuth);
      return fetch(url, {
        ...fetchOptions,
        headers: {
          ...headers,
          ...(fetchOptions.headers ?? {}),
        },
        credentials: 'include', // Required for HttpOnly cookies
      });
    };

    let response = await makeRequest();

    // If 401, not a skipAuth request, not already retried, and not the refresh request itself
    if (response.status === 401 && !skipAuth && !_retry && !path.includes('/auth/refresh')) {
      const newToken = await this.refreshAuthToken();
      if (newToken) {
        // Retry the original request exactly once with the refreshed in-memory token
        return this.request<T>(path, {
          ...options,
          _retry: true,
        });
      }
    }

    return this.handleResponse<T>(response);
  }

  async get<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  async post<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  async postForm<T>(path: string, formData: FormData): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      headers: {}, // Let browser set multipart content-type
      body: formData,
      skipAuth: false,
    });
  }
}

// Singleton instance
export const apiClient = new ApiClient();
