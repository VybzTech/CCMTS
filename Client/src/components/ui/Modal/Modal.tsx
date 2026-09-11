/**
 * Generic modal shell - the PHP app only ever used this pattern for
 * confirm dialogs (ConfirmDialogProvider.tsx builds on top of this),
 * but it's exposed standalone here for the next developer who needs a
 * one-off modal (a letter preview, an image lightbox, whatever) without
 * having to re-derive the overlay/escape-key/backdrop-click mechanics.
 *
 * Renders .modal-overlay / .modal-box from styles/app.css - the same
 * classes the PHP app's confirmAction() and IdleTimeout warning used.
 */
import { useEffect } from 'react';
import type { ReactNode } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Set false for dialogs that must be acted on explicitly (mirrors
   *  the PHP app's idle-timeout warning, which deliberately can't be
   *  backdrop-dismissed - see IdleTimeout._buildOverlay in the PHP
   *  app's app.js for why). */
  closeOnBackdropClick?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  children,
  closeOnBackdropClick = true,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay active"
      onClick={(event) => {
        if (closeOnBackdropClick && event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal-box" role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}
