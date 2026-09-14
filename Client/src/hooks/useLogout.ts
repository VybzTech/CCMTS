/**
 * The one place a *user-initiated* sign-out is defined: confirm first,
 * then clear the session. Every "Logout" control in the app goes
 * through this so the wording, icon and button labels can't drift
 * between call sites (currently TopBar's user dropdown and the
 * ForcePasswordResetPage escape hatch).
 *
 * Deliberately NOT folded into AuthContext.logout(): that same function
 * is called non-interactively by the 401 interceptor and the 10-minute
 * idle timeout, and neither of those can prompt - the session is
 * already gone by the time they run, so there'd be nothing to confirm.
 * AuthContext.logout() stays the silent primitive; this is the
 * interactive wrapper around it.
 *
 * Resolves true if the user went through with it, false if they backed
 * out - call sites that need to do something afterwards (redirecting,
 * say) must check it rather than assuming the session ended.
 *
 * Usage:
 *   const confirmLogout = useLogout();
 *   <button onClick={() => void confirmLogout()}>Logout</button>
 */
import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { useConfirm } from '../components/ui/Modal/useConfirm';

export function useLogout() {
  const { logout } = useAuth();
  const confirm = useConfirm();

  return useCallback(async () => {
    const ok = await confirm({
      title: 'Log out?',
      message: "You'll be returned to the sign-in screen and any unsaved work on this page will be lost.",
      confirmLabel: 'Log out',
      cancelLabel: 'Stay signed in',
      // Red (danger) to match the red Logout item in the user menu, but
      // with a sign-out glyph: the danger variant's default icon is a
      // trash can, which reads as "delete something".
      variant: 'danger',
      icon: 'fa-right-from-bracket',
    });
    if (ok) logout();
    return ok;
  }, [confirm, logout]);
}
