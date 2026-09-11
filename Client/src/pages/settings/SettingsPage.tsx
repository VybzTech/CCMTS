/**
 * Port of the PHP app's pages/settings.php. The API doc has no
 * update-profile/change-password endpoints, so this is read-only
 * account info plus the theme preference (which already lives in the
 * sidebar toggle - shown again here since "Settings" is where a user
 * instinctively looks for it too).
 */
import { AppShell } from '../../components/layout/AppShell';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { formatRoleLabel } from '../../utils/format';

export function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <AppShell pageTitle="Settings">
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Settings</h1>
            <p>Your account details and display preferences.</p>
          </div>
        </div>

        <Card>
          <CardHeader title="Account" />
          <CardBody>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Name</span>
                <span className="detail-value">{user?.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email</span>
                <span className="detail-value">{user?.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Role</span>
                <span className="detail-value">{user ? formatRoleLabel(user.role) : ''}</span>
              </div>
            </div>
            <p className="secondary-text mt-md">
              Password changes and profile editing aren't available yet - the API this app talks to
              doesn't expose those endpoints (see API_DOCUMENTATION.md).
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Display" />
          <CardBody>
            <div className="flex-row" style={{ justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontWeight: 600 }}>Theme</p>
                <p className="secondary-text">Currently using {theme} mode.</p>
              </div>
              <button type="button" className="btn btn-secondary" onClick={toggleTheme}>
                Switch to {theme === 'dark' ? 'light' : 'dark'} mode
              </button>
            </div>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
