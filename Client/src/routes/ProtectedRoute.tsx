/**
 * Route guard - equivalent to the PHP app's require_auth() /
 * require_role() calls at the top of each page file, just expressed as
 * a wrapper component instead of an early-return in a script.
 *
 * Usage in App.tsx:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard" element={<DashboardPage />} />
 *   </Route>
 *
 *   <Route element={<ProtectedRoute allow={['Admin']} />}>
 *     <Route path="/couriers" element={<CouriersPage />} />
 *   </Route>
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types/api';

interface ProtectedRouteProps {
  /** Omit to allow any authenticated role; pass specific roles to
   *  restrict further (mirrors require_role(['Admin', ...]) in the
   *  PHP app). */
  allow?: UserRole[];
}

export function ProtectedRoute({ allow }: ProtectedRouteProps) {
  const { user, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    // Session restore (GET /auth/me with a stored token) is still in
    // flight - render nothing rather than redirecting prematurely,
    // which would bounce an already-logged-in user to /login on every
    // page refresh.
    return null;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // A Management-reset account can't reach anything else until it
  // changes its password - ForcePasswordResetPage is the one route
  // exempted, or this would redirect to itself forever.
  if (user.mustResetPassword && location.pathname !== '/force-password-reset') {
    return <Navigate to="/force-password-reset" replace />;
  }

  if (allow && !allow.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
