/**
 * Landing page for the Courier role (DashboardRouter's `case 'Courier'`).
 *
 * Scope note: this is deliberately NOT a stats dashboard in the mould of
 * the ODU/Admin/Management ones. Those numbers a courier would care
 * about - performance score, completed-deliveries total, active task
 * count - live on the `couriers` table, and there is no endpoint that
 * lets a courier read their own courier profile (GET /couriers is
 * Admin/Management-only, and there's no /couriers/me). Rather than add
 * backend surface for a v1 nice-to-have, everything here is derived from
 * GET /letters, which already self-filters to this courier's own
 * assignments server-side.
 *
 * So the page answers the only question a rider opens their phone to
 * ask: what am I delivering next? Counts are a summary of that queue,
 * not a performance report.
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { DeliveryCard } from '../../components/letters/DeliveryCard';
import { useAuth } from '../../hooks/useAuth';
import { useAsyncData } from '../../hooks/useAsyncData';
import { fetchLetters } from '../../services/letterService';
import { EMPTY_LETTERS, computeCourierQueue } from '../../utils/letterStats';

/** One page big enough to hold a courier's whole workload - see
 *  letterStats.ts's file comment on computing breakdowns client-side. */
const LARGE_PAGE_SIZE = 1000;

/** How many active jobs to surface before deferring to My Deliveries.
 *  Small on purpose: this is a "what's next" view on a phone screen. */
const PREVIEW_COUNT = 4;

export function CourierDashboardPage() {
  const { user } = useAuth();

  const { data, isLoading, error } = useAsyncData(() => fetchLetters({ limit: LARGE_PAGE_SIZE }), []);

  const letters = data?.letters ?? EMPTY_LETTERS;
  const queue = useMemo(() => computeCourierQueue(letters), [letters]);
  const nextUp = queue.active.slice(0, PREVIEW_COUNT);

  return (
    <AppShell pageTitle="My Round">
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Hello, {user?.name} 👋</h1>
            <p>
              {queue.active.length === 0
                ? 'Nothing assigned to you right now — enjoy the break.'
                : `You have ${queue.active.length} ${queue.active.length === 1 ? 'delivery' : 'deliveries'} to complete.`}
            </p>
          </div>
          <span className="date-badge">
            <i className="fas fa-calendar-day" aria-hidden="true" />
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
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
              <StatCard
                accent="purple"
                icon="fa-box"
                value={queue.toPickUp.length}
                label="To Pick Up"
                sublabel="Assigned, not yet collected"
              />
              <StatCard
                accent="cyan"
                icon="fa-shipping-fast"
                value={queue.inTransit.length}
                label="In Transit"
                sublabel="Out for delivery now"
              />
              <StatCard
                accent="green"
                icon="fa-check-circle"
                value={queue.deliveredToday}
                label="Delivered Today"
                sublabel="Completed since midnight"
              />
            </div>

            <Card>
              <CardHeader
                title="Next Up"
                action={
                  <Link to="/my-deliveries" className="btn btn-secondary btn-sm">
                    View All
                  </Link>
                }
              />
              <CardBody>
                {nextUp.length === 0 ? (
                  <EmptyState
                    icon="fa-mug-hot"
                    title="No active deliveries"
                    description="Nothing is assigned to you at the moment. New assignments will show up here."
                    action={
                      <Link to="/my-deliveries" className="btn btn-secondary mt-md">
                        <i className="fas fa-clock-rotate-left" /> See past deliveries
                      </Link>
                    }
                  />
                ) : (
                  <>
                    {nextUp.map((letter) => (
                      <DeliveryCard key={letter.id} letter={letter} />
                    ))}
                    {queue.active.length > nextUp.length && (
                      <Link to="/my-deliveries" className="btn btn-secondary btn-block mt-md">
                        View all {queue.active.length} deliveries
                      </Link>
                    )}
                  </>
                )}
              </CardBody>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
