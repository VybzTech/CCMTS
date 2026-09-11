/**
 * /dashboard resolves to a different page component per role - same
 * idea as the PHP app's dashboard_url() + separate
 * pages/odu|admin|management/dashboard.php files, just picked at
 * render time instead of at redirect time.
 */
import { useAuth } from '../../hooks/useAuth';
import { OduDashboardPage } from './OduDashboardPage';
import { AdminDashboardPage } from './AdminDashboardPage';
import { ManagementDashboardPage } from './ManagementDashboardPage';
import { CourierDashboardPage } from '../courier/CourierDashboardPage';

export function DashboardRouter() {
  const { user } = useAuth();

  switch (user?.role) {
    case 'Admin':
      return <AdminDashboardPage />;
    case 'Management':
      return <ManagementDashboardPage />;
    case 'Courier':
      return <CourierDashboardPage />;
    // ODU is the default rather than an explicit case only because it's
    // the least-privileged dashboard - keep it that way, and give any
    // new role its own case. A missing case here is what left couriers
    // looking at the ODU dashboard ("Register Letter" and all) before
    // the Courier UI existed.
    case 'ODU':
    default:
      return <OduDashboardPage />;
  }
}
