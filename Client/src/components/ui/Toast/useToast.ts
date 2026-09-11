import { useContext } from 'react';
import { ToastContext, type ToastContextValue } from './ToastProvider';

/** Call as showToast('success', 'Letter approved') from any component -
 *  same calling convention as the PHP app's global showToast(type, msg)
 *  in app.js, just accessed through a hook instead of a global. */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast() must be used inside <ToastProvider>');
  }
  return context;
}
