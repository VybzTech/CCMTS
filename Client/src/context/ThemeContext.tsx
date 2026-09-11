/**
 * Light/dark theme state - mirrors the PHP app's approach exactly:
 * a `data-theme` attribute on <html> that styles/app.css's
 * :root[data-theme="dark"] block reacts to, persisted to localStorage,
 * defaulting to the OS preference on first visit. Anti-flash handling
 * lives in index.html's inline script (see comment there) rather than
 * here, because by the time React mounts and this provider runs, a
 * wrong-theme flash has already happened - the PHP app has the same
 * constraint (templates/theme-init.php runs before app.css loads).
 */
import { createContext, useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'ccmts-theme';

function readInitialTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

export interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Read from the DOM, not a fresh OS-preference check, because the
  // inline script in index.html already resolved stored-vs-OS
  // preference and set the attribute before this component ever runs.
  const [theme, setTheme] = useState<Theme>(readInitialTheme);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Same reasoning as apiClient's setStoredToken: persistence is
        // best-effort, a private-browsing quota error shouldn't crash
        // the toggle.
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
