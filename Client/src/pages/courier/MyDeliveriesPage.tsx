/**
 * The courier's own delivery queue - the role's equivalent of
 * LettersListPage, which they deliberately don't get access to (that
 * page lists every directorate's mail and filters/paginates around
 * fields a rider has no use for).
 *
 * No `courierId` filter is sent: GET /letters already restricts a
 * Courier-role caller to their own assignments server-side. The tabs
 * here slice that response by lifecycle stage rather than re-querying,
 * which also means switching tabs is instant on a slow mobile
 * connection instead of costing a round trip each time.
 */
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { DeliveryCard } from '../../components/letters/DeliveryCard';
import { useAsyncData } from '../../hooks/useAsyncData';
import { fetchLetters } from '../../services/letterService';
import { EMPTY_LETTERS, computeCourierQueue } from '../../utils/letterStats';

const LARGE_PAGE_SIZE = 1000;

type TabKey = 'active' | 'pickup' | 'transit' | 'completed';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'active', label: 'Active', icon: 'fa-list-check' },
  { key: 'pickup', label: 'To Pick Up', icon: 'fa-box' },
  { key: 'transit', label: 'In Transit', icon: 'fa-shipping-fast' },
  { key: 'completed', label: 'Completed', icon: 'fa-check-double' },
];

const EMPTY_COPY: Record<TabKey, { title: string; description: string }> = {
  active: {
    title: 'No active deliveries',
    description: 'Nothing is currently assigned to you. New assignments appear here automatically.',
  },
  pickup: {
    title: 'Nothing to pick up',
    description: 'You have no letters waiting to be collected.',
  },
  transit: {
    title: 'Nothing in transit',
    description: "You aren't carrying any letters right now.",
  },
  completed: {
    title: 'No completed deliveries yet',
    description: 'Delivered and undelivered letters will be listed here once you close them out.',
  },
};

export function MyDeliveriesPage() {
  // Tab lives in the URL so a courier can refresh, or come back from a
  // letter, without losing their place.
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab: TabKey = TABS.some((tab) => tab.key === rawTab) ? (rawTab as TabKey) : 'active';

  const { data, isLoading, error } = useAsyncData(() => fetchLetters({ limit: LARGE_PAGE_SIZE }), []);

  const letters = data?.letters ?? EMPTY_LETTERS;
  const queue = useMemo(() => computeCourierQueue(letters), [letters]);

  const countsByTab: Record<TabKey, number> = {
    active: queue.active.length,
    pickup: queue.toPickUp.length,
    transit: queue.inTransit.length,
    completed: queue.completed.length,
  };

  const visibleLetters = {
    active: queue.active,
    pickup: queue.toPickUp,
    transit: queue.inTransit,
    completed: queue.completed,
  }[activeTab];

  function selectTab(tab: TabKey) {
    const next = new URLSearchParams(searchParams);
    if (tab === 'active') next.delete('tab');
    else next.set('tab', tab);
    setSearchParams(next);
  }

  return (
    <AppShell pageTitle="My Deliveries">
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>My Deliveries</h1>
            <p>Every letter assigned to you. Tap one to update its status.</p>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger">
            <i className="fas fa-circle-exclamation" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrolls horizontally rather than wrapping on narrow screens,
            so the tab row stays one predictable line on a phone. */}
        <div className="delivery-tabs" role="tablist" aria-label="Delivery status">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`delivery-tab${activeTab === tab.key ? ' active' : ''}`}
              onClick={() => selectTab(tab.key)}
            >
              <i className={`fas ${tab.icon}`} aria-hidden="true" />
              <span>{tab.label}</span>
              <span className="badge">{countsByTab[tab.key]}</span>
            </button>
          ))}
        </div>

        {!isLoading && !error && (
          <Card>
            <CardHeader
              title={`${TABS.find((tab) => tab.key === activeTab)?.label} (${visibleLetters.length})`}
            />
            <CardBody>
              {visibleLetters.length === 0 ? (
                <EmptyState
                  icon="fa-envelope-open"
                  title={EMPTY_COPY[activeTab].title}
                  description={EMPTY_COPY[activeTab].description}
                />
              ) : (
                visibleLetters.map((letter) => <DeliveryCard key={letter.id} letter={letter} />)
              )}
            </CardBody>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
