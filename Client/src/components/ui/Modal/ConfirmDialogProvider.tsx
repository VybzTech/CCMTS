/**
 * React port of confirmAction(message, title) from the PHP app's
 * app.js: shows a modal with Cancel/Confirm buttons and resolves a
 * promise with true/false depending which one was clicked (or false if
 * dismissed via backdrop/Escape). Same default icon/title/button
 * labels as the original so existing call sites need no changes
 * beyond `await confirmAction(...)` becoming `await confirm(...)`.
 *
 * Usage:
 *   const confirm = useConfirm();
 *   const ok = await confirm({ message: 'Delete this courier?' });
 *   if (!ok) return;
 */
import { createContext, useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { Modal } from './Modal';

export type ConfirmVariant = 'warning' | 'danger' | 'info';

export interface ConfirmOptions {
  title?: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Defaults to 'warning' to match the PHP app's confirmAction(), which
   *  always used the same warning-triangle icon regardless of how
   *  destructive the action was. Pass 'danger' for delete-style actions
   *  where a stronger visual cue is worth the deviation. */
  variant?: ConfirmVariant;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

// eslint-disable-next-line react-refresh/only-export-components
export const ConfirmDialogContext = createContext<ConfirmFn | undefined>(undefined);

const ICON_BY_VARIANT: Record<ConfirmVariant, string> = {
  warning: 'fa-exclamation-triangle',
  danger: 'fa-trash',
  info: 'fa-circle-info',
};

interface PendingConfirm extends ConfirmOptions {
  resolve: (result: boolean) => void;
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  function settle(result: boolean) {
    pending?.resolve(result);
    setPending(null);
  }

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {children}
      <Modal isOpen={pending !== null} onClose={() => settle(false)}>
        {pending && (
          <>
            <div className={`modal-icon ${pending.variant ?? 'warning'}`}>
              <i className={`fas ${ICON_BY_VARIANT[pending.variant ?? 'warning']}`} aria-hidden="true" />
            </div>
            <h3>{pending.title ?? 'Confirm Action'}</h3>
            <p>{pending.message}</p>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary modal-cancel" onClick={() => settle(false)}>
                {pending.cancelLabel ?? 'Cancel'}
              </button>
              <button
                type="button"
                className={`btn ${pending.variant === 'danger' ? 'btn-danger' : 'btn-primary'} modal-confirm`}
                onClick={() => settle(true)}
              >
                {pending.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </ConfirmDialogContext.Provider>
  );
}
