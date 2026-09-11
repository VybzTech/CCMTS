/**
 * Port of the PHP app's pages/odu/dashboard.php. ODU users only see
 * their own directorate's letters - achieved here via the API's
 * optional `directorate_id` filter on GET /letters (a documented
 * param, not an invented restriction), applied automatically from the
 * logged-in user's directorateId whenever their role is directorate-
 * restricted (see utils/permissions.ts).
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { StatCard } from '../../components/ui/StatCard';
import { ActionCard } from '../../components/ui/ActionCard';
import { ChartCard } from '../../components/charts/ChartCard';
import { LineChart } from '../../components/charts/LineChart';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { useAsyncData } from '../../hooks/useAsyncData';
import { fetchLetters } from '../../services/letterService';
import { EMPTY_LETTERS, computeDeliveryTrend, computeLetterStats } from '../../utils/letterStats';
import { formatCurrency } from '../../utils/format';
import { isDirectorateRestricted } from '../../utils/permissions';

const RECENT_LETTERS_COUNT = 5;
const LARGE_PAGE_SIZE = 1000; // see letterStats.ts's file comment for why

export function OduDashboardPage() {
  const { user } = useAuth();
  const [trendPeriod, setTrendPeriod] = useState<7 | 30>(7);

  const restrictedToOwnDirectorate = !!user && isDirectorateRestricted(user.role);

  const { data, isLoading, error } = useAsyncData(
    () =>
      fetchLetters({
        directorate_id: restrictedToOwnDirectorate && user?.directorateId ? Number(user.directorateId) : undefined,
        limit: LARGE_PAGE_SIZE,
      }),
    [restrictedToOwnDirectorate, user?.directorateId]
  );

  const letters = data?.letters ?? EMPTY_LETTERS;
  const stats = useMemo(() => computeLetterStats(letters), [letters]);
  const trend = useMemo(() => computeDeliveryTrend(letters, trendPeriod), [letters, trendPeriod]);
  const recentLetters = useMemo(
    () =>
      [...letters]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, RECENT_LETTERS_COUNT),
    [letters]
  );
  const trendHasData = trend.data.some((count) => count > 0);

  return (
    <AppShell pageTitle="Dashboard">
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Welcome back, {user?.name} 👋</h1>
            <p>Here's what's happening with your correspondence today.</p>
          </div>
          <span className="date-badge">
            <i className="fas fa-calendar-day" aria-hidden="true" />
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {error && (
          <div className="alert alert-danger">
            <i className="fas fa-circle-exclamation" />
            <span>{error}</span>
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div className="stats-grid">
              <StatCard accent="blue" icon="fa-envelope" value={stats.total} label="Total Letters" sublabel="All registered letters" />
              <StatCard accent="yellow" icon="fa-clock" value={stats.inProgress} label="In Progress" sublabel="Currently being processed" />
              <StatCard accent="green" icon="fa-check-circle" value={stats.delivered} label="Delivered" sublabel="Successfully delivered" />
              <StatCard
                accent="red"
                icon="fa-times-circle"
                value={formatCurrency(stats.undeliveredLiability)}
                label="Undelivered Liability"
                sublabel="Total outstanding liability"
              />
            </div>

            <div className="charts-grid">
              <ChartCard
                title="Delivery Trend"
                isEmpty={!trendHasData}
                emptyMessage={`No deliveries recorded this ${trendPeriod === 30 ? 'month' : 'week'} yet.`}
                headerAction={
                  <select
                    value={trendPeriod}
                    onChange={(event) => setTrendPeriod(Number(event.target.value) as 7 | 30)}
                    aria-label="Delivery trend period"
                  >
                    <option value={7}>This Week</option>
                    <option value={30}>This Month</option>
                  </select>
                }
              >
                <LineChart labels={trend.labels} data={trend.data} />
              </ChartCard>

              <ChartCard title="Quick Actions">
                <div className="quick-actions" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  <ActionCard to="/letters/create" icon="fa-paper-plane" label="Register Letter" />
                  <ActionCard to="/letters" icon="fa-list" label="View All" />
                </div>
              </ChartCard>
            </div>

            <Card>
              <CardHeader
                title="Recent Letters"
                action={
                  <Link to="/letters" className="btn btn-secondary btn-sm">
                    View All
                  </Link>
                }
              />
              <CardBody>
                {recentLetters.length === 0 ? (
                  <EmptyState
                    icon="fa-envelope-open"
                    title="No letters yet"
                    description="Start by registering your first letter."
                    action={
                      <Link to="/letters/create" className="btn btn-primary mt-md">
                        <i className="fas fa-plus" /> Register Letter
                      </Link>
                    }
                  />
                ) : (
                  recentLetters.map((letter) => (
                    <Link key={letter.id} to={`/letters/${letter.id}`} className="list-item clickable">
                      <div className="list-item-info">
                        <span className="tracking-id">{letter.trackingId}</span>
                        <span className="secondary-text">
                          {letter.recipientName} - {letter.subject}
                        </span>
                      </div>
                      <StatusBadge status={letter.status} />
                    </Link>
                  ))
                )}
              </CardBody>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
