/**
 * App-wide authentication state. Wrap the app in <AuthProvider> once
 * (done in main.tsx) and read/act on auth from anywhere with the
 * useAuth() hook in hooks/useAuth.ts - don't import this context
 * directly elsewhere, go through the hook so the provider is the only
 * place that needs to know this is Context under the hood.
 */
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types/api';
import { fetchCurrentUser, login as loginRequest } from '../services/authService';
import { getStoredToken, onUnauthorized, setStoredToken } from '../services/apiClient';
import { useToast } from '../components/ui/Toast/useToast';

const IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const IDLE_CHECK_INTERVAL_MS = 15 * 1000;
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const;

export interface AuthContextValue {
  user: User | null;
  /** True only while the app is restoring a session on first load -
   *  distinct from any later per-request loading state, so a route
   *  guard can tell "we don't know yet" from "we know you're logged
   *  out". */
  isInitializing: boolean;
  /** Resolves to whether this account must reset its password before
   *  doing anything else (see User.mustResetPassword) - LoginPage uses
   *  this to route to /force-password-reset instead of /dashboard. */
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  /** Patches the in-memory user after a successful password change, so
   *  ProtectedRoute stops redirecting to /force-password-reset without
   *  needing a full GET /auth/me round-trip. */
  clearMustResetPassword: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const { showToast } = useToast();

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
  }, []);

  // On first mount, if a token was persisted from a previous session,
  // validate it against GET /auth/me rather than trusting it blindly -
  // it may have expired since the last visit.
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setIsInitializing(false);
      return;
    }

    fetchCurrentUser()
      .then((response) => setUser(response.user))
      .catch(() => setStoredToken(null))
      .finally(() => setIsInitializing(false));
  }, []);

  // A 401 from any request (interceptor in apiClient.ts) means the
  // session is no longer valid server-side - clear it here too so the
  // UI doesn't keep acting like the user is logged in.
  useEffect(() => onUnauthorized(logout), [logout]);

  // Auto-logout after 10 minutes with no user activity. Tracked as a
  // timestamp ref rather than resetting a setTimeout on every event, so
  // high-frequency listeners (scroll) don't churn timers - a periodic
  // check is cheap and 15s of slop on a 10 minute timeout is fine.
  const lastActivityRef = useRef(Date.now());
  useEffect(() => {
    if (!user) return;

    lastActivityRef.current = Date.now();
    const markActive = () => {
      lastActivityRef.current = Date.now();
    };
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, markActive));

    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= IDLE_TIMEOUT_MS) {
        logout();
        showToast('warning', "You've been signed out after 10 minutes of inactivity.");
      }
    }, IDLE_CHECK_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, markActive));
    };
  }, [user, logout, showToast]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginRequest({ email, password });
    setStoredToken(response.access_token);
    setUser({
      id: response.id,
      name: response.name,
      email: response.email,
      role: response.role,
      directorateId: response.directorate?.id,
      mustResetPassword: response.mustResetPassword,
    });
    return response.mustResetPassword ?? false;
  }, []);

  const clearMustResetPassword = useCallback(() => {
    setUser((current) => (current ? { ...current, mustResetPassword: false } : current));
  }, []);

  const value = useMemo(
    () => ({ user, isInitializing, login, logout, clearMustResetPassword }),
    [user, isInitializing, login, logout, clearMustResetPassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
