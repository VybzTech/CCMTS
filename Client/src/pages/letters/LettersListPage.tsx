/**
 * Port of the PHP app's pages/letters/index.php (referenced as "All
 * Letters" in the sidebar for every role). Filter/pagination state
 * lives in the URL's query string (via useSearchParams) rather than
 * component state, so the search box in TopBar (which navigates to
 * `/letters?search=...`) and a shared/bookmarked filtered URL both
 * work without any extra plumbing.
 */
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { FilterBar, FilterField } from '../../components/ui/FilterBar';
import { DataTable } from '../../components/ui/DataTable';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { useAsyncData } from '../../hooks/useAsyncData';
import { fetchLetters } from '../../services/letterService';
import { formatCurrency, formatDate } from '../../utils/format';
import { isDirectorateRestricted } from '../../utils/permissions';
import type { Letter, LetterPriority, LetterStatus } from '../../types/api';

const PAGE_SIZE = 20;

const STATUS_OPTIONS: LetterStatus[] = [
  'Pending_Approval',
  'Approved',
  'Assigned',
  'In_Transit',
  'Delivered',
  'Undelivered',
];
const PRIORITY_OPTIONS: LetterPriority[] = ['Low', 'Medium', 'High'];

export function LettersListPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page') ?? '1');
  const status = (searchParams.get('status') as LetterStatus | null) ?? undefined;
  const priority = (searchParams.get('priority') as LetterPriority | null) ?? undefined;
  const search = searchParams.get('search') ?? '';

  const restrictedToOwnDirectorate = !!user && isDirectorateRestricted(user.role);

  const { data, isLoading, error } = useAsyncData(
    () =>
      fetchLetters({
        page,
        limit: PAGE_SIZE,
        status,
        priority,
        directorate_id: restrictedToOwnDirectorate && user?.directorateId ? Number(user.directorateId) : undefined,
      }),
    [page, status, priority, restrictedToOwnDirectorate, user?.directorateId]
  );

  // The API has no full-text `search` param (see API_DOCUMENTATION.md's
  // GET /letters query params) - the top bar's search box still needs
  // to do *something* useful, so this filters the current page
  // client-side by tracking ID/recipient/subject. It only searches
  // what's already been fetched, not the whole dataset; a real search
  // feature would need the backend to add a `search` param.
  const letters = useMemo(() => {
    const all = data?.letters ?? [];
    if (!search) return all;
    const needle = search.toLowerCase();
    return all.filter(
      (letter) =>
        letter.trackingId.toLowerCase().includes(needle) ||
        letter.recipientName.toLowerCase().includes(needle) ||
        letter.subject.toLowerCase().includes(needle)
    );
  }, [data, search]);

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page'); // any filter change restarts pagination
    setSearchParams(next);
  }

  function goToPage(nextPage: number) {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next);
  }

  return (
    <AppShell pageTitle="All Letters">
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>All Letters</h1>
            <p>Browse and filter every registered letter{search ? ` matching "${search}"` : ''}.</p>
          </div>
        </div>

        <FilterBar resultsLabel={data ? `${data.pagination.total} letter(s) found` : undefined}>
          <FilterField label="Status:">
            <select value={status ?? ''} onChange={(e) => updateFilter('status', e.target.value)}>
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Priority:">
            <select value={priority ?? ''} onChange={(e) => updateFilter('priority', e.target.value)}>
              <option value="">All Priorities</option>
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </FilterField>
        </FilterBar>

        {error && (
          <div className="alert alert-danger">
            <i className="fas fa-circle-exclamation" />
            <span>{error}</span>
          </div>
        )}

        {!isLoading && !error && (
          <Card>
            <CardHeader title="Letters" />
            <CardBody>
              <DataTable<Letter>
                rows={letters}
                keyExtractor={(letter) => letter.id}
                emptyState={
                  <EmptyState
                    icon="fa-envelope-open"
                    title="No letters found"
                    description="Try adjusting your filters, or register a new letter."
                  />
                }
                columns={[
                  {
                    key: 'trackingId',
                    header: 'Tracking ID',
                    render: (letter) => <Link to={`/letters/${letter.id}`}>{letter.trackingId}</Link>,
                  },
                  { key: 'recipient', header: 'Recipient', render: (letter) => letter.recipientName },
                  { key: 'subject', header: 'Subject', render: (letter) => letter.subject },
                  {
                    key: 'priority',
                    header: 'Priority',
                    render: (letter) => <PriorityBadge priority={letter.priority} />,
                  },
                  { key: 'status', header: 'Status', render: (letter) => <StatusBadge status={letter.status} /> },
                  { key: 'liability', header: 'Liability', render: (letter) => formatCurrency(letter.liabilityValue) },
                  { key: 'created', header: 'Created', render: (letter) => formatDate(letter.createdAt) },
                ]}
              />

              {data && (
                <Pagination page={data.pagination.page} totalPages={data.pagination.pages} onPageChange={goToPage} />
              )}
            </CardBody>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
