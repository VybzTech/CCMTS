/**
 * Single axios instance every service module should import instead of
 * calling axios directly - this is what centralizes the base URL and
 * the JWT attachment/expiry handling described in API_DOCUMENTATION.md
 * ("Authentication: ... Header: Authorization: Bearer <token>").
 *
 * Swapping the mock server for a real Node backend later is a one-line
 * change: set VITE_API_BASE_URL in .env (see .env.example) to the real
 * API's origin. Nothing else in the app needs to change, because every
 * page talks to the functions in services/*.ts, never to axios or fetch
 * directly.
 */
import axios, { type AxiosError } from 'axios';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1';

const TOKEN_STORAGE_KEY = 'ccmts_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // localStorage can throw in private-browsing/quota-exceeded edge
    // cases - losing persistence there is acceptable, crashing isn't.
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the bearer token (per the doc's auth section) to every
// outgoing request, read fresh from storage each time so a login in
// another tab is picked up without needing a page reload.
apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Fires on any 401 (no token / invalid token / expired token - the
 *  doc lists all three under the same status code) so a stale session
 *  clears itself instead of the app silently failing every request.
 *  AuthContext subscribes to this to redirect to /login. */
type UnauthorizedListener = () => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();

export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      setStoredToken(null);
      unauthorizedListeners.forEach((listener) => listener());
    }
    return Promise.reject(error);
  }
);

/** Narrows an unknown catch-block error down to the API's documented
 *  { message, error? } shape, falling back to something readable for
 *  network failures / non-API errors (a dead mock server, CORS, etc). */
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
