/**
 * Toast notifications - React port of showToast()/removeToast() in the
 * PHP app's public/js/app.js. Same visual behavior (slide in, 4s
 * auto-dismiss, manual close button) and the same CSS classes
 * (.toast-container, .toast, .toast-success/.toast-danger/.toast-warning
 * in styles/app.css), just driven by state instead of direct DOM
 * manipulation.
 *
 * Note: the PHP app's CSS never defined a `.toast-info` color variant
 * (only success/danger/warning got one) - that's carried over here
 * faithfully rather than "fixed", so an `info` toast renders in the
 * base neutral style, same as it always did.
 */
import { createContext, useCallback, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  isVisible: boolean;
}

export interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const ICON_BY_TYPE: Record<ToastType, string> = {
  success: 'fa-check-circle',
  error: 'fa-exclamation-circle',
  warning: 'fa-exclamation-triangle',
  info: 'fa-info-circle',
};

// `error` maps to the `danger` CSS modifier - the app's semantic palette
// calls it "danger", the API/JS convention calls it "error"; this is
// the one place that mismatch gets reconciled.
function cssTypeFor(type: ToastType): string {
  return type === 'error' ? 'danger' : type;
}

const AUTO_DISMISS_MS = 4000;
const REMOVE_AFTER_TRANSITION_MS = 300;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const removeToast = useCallback((id: number) => {
    // Two-step removal so the slide-out transition (.toast without
    // .show) actually plays before the node leaves the DOM, matching
    // the PHP version's setTimeout-then-remove pattern.
    setToasts((current) =>
      current.map((toast) => (toast.id === id ? { ...toast, isVisible: false } : toast))
    );
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, REMOVE_AFTER_TRANSITION_MS);
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, type, message, isVisible: false }]);

      // Flip to visible on the next frame so the CSS transition (which
      // animates from the base .toast state to .toast.show) actually
      // runs, instead of mounting already in the "shown" state.
      requestAnimationFrame(() => {
        setToasts((current) =>
          current.map((toast) => (toast.id === id ? { ...toast, isVisible: true } : toast))
        );
      });

      setTimeout(() => removeToast(id), AUTO_DISMISS_MS);
    },
    [removeToast]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${cssTypeFor(toast.type)}${toast.isVisible ? ' show' : ''}`}
          >
            <i className={`fas ${ICON_BY_TYPE[toast.type]} toast-icon`} aria-hidden="true" />
            <span className="toast-message">{toast.message}</span>
            <button
              type="button"
              className="toast-close"
              aria-label="Dismiss notification"
              onClick={() => removeToast(toast.id)}
            >
              <i className="fas fa-times" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
