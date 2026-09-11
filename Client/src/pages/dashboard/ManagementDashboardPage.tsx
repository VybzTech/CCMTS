/**
 * Port of the PHP app's pages/management/dashboard.php - organization-
 * wide overview with per-directorate mini stat cards + progress bars
 * (styles/app.css's .directorate-card / .directorate-stats /
 * .progress-bar, originally built for the standalone Directorates
 * list page but reused here since the visual language is identical).
 */
import { useMemo } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { useAsyncData } from '../../hooks/useAsyncData';
import { fetchLetters } from '../../services/letterService';
import { fetchDirectorates, EMPTY_DIRECTORATES } from '../../services/directorateService';
import { EMPTY_LETTERS, computeDirectoratePerformance, computeLetterStats } from '../../utils/letterStats';
import { formatCurrency } from '../../utils/format';

const LARGE_PAGE_SIZE = 1000;

export function ManagementDashboardPage() {
  const { user } = useAuth();

  const lettersQuery = useAsyncData(() => fetchLetters({ limit: LARGE_PAGE_SIZE }), []);
  const directoratesQuery = useAsyncData(() => fetchDirectorates(), []);

  const letters = lettersQuery.data?.letters ?? EMPTY_LETTERS;
  const directorates = directoratesQuery.data ?? EMPTY_DIRECTORATES;
  const stats = useMemo(() => computeLetterStats(letters), [letters]);
  const performanceByDirectorate = useMemo(() => {
    const rows = computeDirectoratePerformance(letters);
    const byId = new Map(rows.map((row) => [row.id, row]));
    // Include every directorate even if it has zero letters, so a
    // brand-new directorate shows a 0/0/0/0% row instead of vanishing.
    return directorates.map(
      (dir) =>
        byId.get(dir.id) ?? {
          id: dir.id,
          name: dir.name,
          code: dir.code,
          total: 0,
          delivered: 0,
          inProgress: 0,
          undelivered: 0,
          deliveryRate: 0,
        }
    );
  }, [letters, directorates]);

  const overallDeliveryRate = (() => {
    const settled = letters.filter((l) => l.status === 'Delivered' || l.status === 'Undelivered').length;
    const delivered = letters.filter((l) => l.status === 'Delivered').length;
    return settled > 0 ? Math.round((delivered / settled) * 100) : 0;
  })();

  const isLoading = lettersQuery.isLoading || directoratesQuery.isLoading;
  const error = lettersQuery.error ?? directoratesQuery.error;

  return (
    <AppShell pageTitle="Management Overview">
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Organization Overview</h1>
            <p>Welcome back, {user?.name}. Performance across all directorates.</p>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger">
            <i className="fas fa-circle-exclamation" />
            <span>{error}</span>
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div className="stats-grid large">
              <StatCard accent="blue" icon="fa-envelope" value={stats.total} label="Total Letters" large />
              <StatCard accent="green" icon="fa-chart-line" value={`${overallDeliveryRate}%`} label="Delivery Rate" large />
              <StatCard
                accent="red"
                icon="fa-times-circle"
                value={formatCurrency(stats.undeliveredLiability)}
                label="At-Risk Liability"
                large
              />
              <StatCard accent="purple" icon="fa-building" value={directorates.length} label="Directorates" large />
            </div>

            <Card>
              <CardHeader title="Directorate Performance" />
              <CardBody>
                <div className="directorates-grid">
                  {performanceByDirectorate.map((dir) => (
                    <div className="directorate-card" key={dir.id}>
                      <div className="directorate-header">
                        <div className="directorate-info">
                          <h3>{dir.name}</h3>
                          <span className="secondary-text">{dir.code}</span>
                        </div>
                        <span className={`delivery-rate ${dir.deliveryRate >= 80 ? 'good' : 'warning'}`}>
                          {dir.deliveryRate}%
                        </span>
                      </div>

                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${dir.deliveryRate}%` }} />
                      </div>

                      <div className="directorate-stats">
                        <div className="stat-item">
                          <span className="stat-value success">{dir.delivered}</span>
                          <span className="stat-label">Delivered</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-value warning">{dir.inProgress}</span>
                          <span className="stat-label">In Progress</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-value danger">{dir.undelivered}</span>
                          <span className="stat-label">Failed</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
