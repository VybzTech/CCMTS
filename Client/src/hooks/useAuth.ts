import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '../context/AuthContext';

/** The only supported way to read/act on auth state - throws loudly if
 *  used outside <AuthProvider> instead of silently returning undefined,
 *  so a missing provider fails at the call site, not three components
 *  deeper. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth() must be used inside <AuthProvider>');
  }
  return context;
}
