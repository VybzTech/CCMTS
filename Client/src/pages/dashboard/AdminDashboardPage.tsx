/**
 * Port of the PHP app's pages/admin/dashboard.php. Admins see every
 * directorate's letters (no directorate_id filter applied), unlike the
 * ODU dashboard.
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { StatCard } from '../../components/ui/StatCard';
import { ActionCard } from '../../components/ui/ActionCard';
import { ChartCard } from '../../components/charts/ChartCard';
import { BarChart } from '../../components/charts/BarChart';
import { DoughnutChart } from '../../components/charts/DoughnutChart';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { useAuth } from '../../hooks/useAuth';
import { useAsyncData } from '../../hooks/useAsyncData';
import { fetchLetters } from '../../services/letterService';
import {
  EMPTY_LETTERS,
  computeCourierWorkload,
  computeDirectorateBreakdown,
  computeDirectoratePerformance,
  computeLetterStats,
} from '../../utils/letterStats';

const LARGE_PAGE_SIZE = 1000;

export function AdminDashboardPage() {
  const { user } = useAuth();

  const { data, isLoading, error } = useAsyncData(
    () => fetchLetters({ limit: LARGE_PAGE_SIZE }),
    []
  );

  const letters = data?.letters ?? EMPTY_LETTERS;
  const stats = useMemo(() => computeLetterStats(letters), [letters]);
  const pendingCount = useMemo(
    () => letters.filter((letter) => letter.status === 'Pending_Approval').length,
    [letters]
  );
  const workload = useMemo(() => computeCourierWorkload(letters), [letters]);
  const breakdown = useMemo(() => computeDirectorateBreakdown(letters), [letters]);
  const performance = useMemo(() => computeDirectoratePerformance(letters), [letters]);

  return (
    <AppShell pageTitle="Admin Dashboard" pendingApprovalsCount={pendingCount}>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Welcome back, {user?.name}. Here's the system-wide overview.</p>
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
              <StatCard accent="yellow" icon="fa-inbox" value={pendingCount} label="Pending Approval" large />
              <StatCard accent="purple" icon="fa-truck" value={stats.inProgress} label="In Progress" large />
              <StatCard accent="green" icon="fa-check-circle" value={stats.delivered} label="Delivered" large />
            </div>

            <div className="quick-actions mb-lg">
              <ActionCard to="/admin/pending" icon="fa-inbox" label="Pending Approvals" badge={pendingCount || undefined} />
              <ActionCard to="/admin/courier-allocation" icon="fa-route" label="Courier Allocation" />
              <ActionCard to="/couriers" icon="fa-truck" label="Courier Pool" />
            </div>

            <div className="charts-grid">
              <ChartCard title="Courier Workload" isEmpty={workload.labels.length === 0}>
                <BarChart labels={workload.labels} data={workload.data} />
              </ChartCard>

              <ChartCard title="Letters by Directorate" isEmpty={breakdown.labels.length === 0}>
                <DoughnutChart labels={breakdown.labels} data={breakdown.data} />
              </ChartCard>
            </div>

            <Card>
              <CardHeader
                title="Directorate Performance"
                action={
                  <Link to="/directorates" className="btn btn-secondary btn-sm">
                    View All
                  </Link>
                }
              />
              <CardBody>
                <DataTable
                  columns={[
                    { key: 'name', header: 'Directorate', render: (row) => `${row.name} (${row.code})` },
                    { key: 'total', header: 'Total', render: (row) => row.total },
                    { key: 'delivered', header: 'Delivered', render: (row) => row.delivered },
                    { key: 'inProgress', header: 'In Progress', render: (row) => row.inProgress },
                    { key: 'undelivered', header: 'Undelivered', render: (row) => row.undelivered },
                    {
                      key: 'rate',
                      header: 'Delivery Rate',
                      render: (row) => (
                        <span className={`delivery-rate ${row.deliveryRate >= 80 ? 'good' : 'warning'}`}>
                          {row.deliveryRate}%
                        </span>
                      ),
                    },
                  ]}
                  rows={performance}
                  keyExtractor={(row) => row.id}
                />
              </CardBody>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
