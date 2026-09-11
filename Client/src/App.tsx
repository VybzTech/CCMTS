/**
 * Route table for the whole app. Kept intentionally flat and readable -
 * add a page by adding one <Route> line here rather than nesting route
 * config in a separate data structure; with ~20 pages total this stays
 * easier to scan than an indirection layer would save.
 *
 * Role-restricted routes use <ProtectedRoute allow={[...]}> - compare
 * against navConfig.ts's per-item `roles` list if a nav link and its
 * route guard ever seem to disagree (a nav item should never link
 * somewhere its own role is blocked from).
 */
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { ForcePasswordResetPage } from './pages/auth/ForcePasswordResetPage';
import { DashboardRouter } from './pages/dashboard/DashboardRouter';
import { ManagementAnalyticsPage } from './pages/dashboard/ManagementAnalyticsPage';
import { LettersListPage } from './pages/letters/LettersListPage';
import { MyDeliveriesPage } from './pages/courier/MyDeliveriesPage';
import { LetterDetailPage } from './pages/letters/LetterDetailPage';
import { LetterCreatePage } from './pages/letters/LetterCreatePage';
import { BulkUploadPage } from './pages/letters/BulkUploadPage';
import { PendingApprovalsPage } from './pages/admin/PendingApprovalsPage';
import { CourierAllocationPage } from './pages/admin/CourierAllocationPage';
import { CouriersPage } from './pages/couriers/CouriersPage';
import { DirectoratesPage } from './pages/directorates/DirectoratesPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { HelpPage } from './pages/help/HelpPage';
import { UsersPage } from './pages/admin/UsersPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Every authenticated role. /letters/:id belongs here rather than
          with the list page below: couriers open their own letters from
          it, and the API 403s a courier who asks for someone else's, so
          the ownership rule doesn't need restating as a route guard. */}
      <Route element={<ProtectedRoute />}>
        <Route path="/force-password-reset" element={<ForcePasswordResetPage />} />
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="/letters/:id" element={<LetterDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/directorates" element={<DirectoratesPage />} />
      </Route>

      {/* "All Letters" is an office view - org-wide (or directorate-wide)
          browsing with filters and pagination. A courier gets
          /my-deliveries instead, so they're excluded here rather than
          being shown a table of mail they can't act on. */}
      <Route element={<ProtectedRoute allow={['ODU', 'Admin', 'Management']} />}>
        <Route path="/letters" element={<LettersListPage />} />
      </Route>

      {/* Courier only */}
      <Route element={<ProtectedRoute allow={['Courier']} />}>
        <Route path="/my-deliveries" element={<MyDeliveriesPage />} />
      </Route>

      {/* ODU only - Register Letter was briefly Admin/Management
          reachable too, deliberately removed; see navConfig.ts */}
      <Route element={<ProtectedRoute allow={['ODU']} />}>
        <Route path="/letters/create" element={<LetterCreatePage />} />
      </Route>

      {/* ODU + Admin/Management (Bulk Upload only) */}
      <Route element={<ProtectedRoute allow={['ODU', 'Admin', 'Management']} />}>
        <Route path="/letters/bulk" element={<BulkUploadPage />} />
      </Route>

      {/* Admin + Management (Management is a superset of Admin - see
          types/api.ts's UserRole comment) */}
      <Route element={<ProtectedRoute allow={['Admin', 'Management']} />}>
        <Route path="/admin/pending" element={<PendingApprovalsPage />} />
        <Route path="/admin/courier-allocation" element={<CourierAllocationPage />} />
        <Route path="/couriers" element={<CouriersPage />} />
      </Route>

      {/* Management only */}
      <Route element={<ProtectedRoute allow={['Management']} />}>
        <Route path="/admin/users" element={<UsersPage />} />
      </Route>

      {/* Management only */}
      <Route element={<ProtectedRoute allow={['Management']} />}>
        <Route path="/management/analytics" element={<ManagementAnalyticsPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
