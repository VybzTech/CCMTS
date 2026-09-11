/**
 * Port of the PHP app's pages/admin/pending.php - letters awaiting
 * approval, with per-letter Approve/Reject actions (styles/app.css's
 * .approval-card family) plus a checkbox-driven bulk approve/reject
 * toolbar (.batch-actions-bar - already in app.css, ported from the PHP
 * design but unused until now).
 *
 * The API only exposes single-letter approve/reject endpoints (no
 * batch-approve - unlike /letters/auto-allocate, which genuinely is a
 * batch endpoint), so "bulk" here is a client-side fan-out: fire every
 * selected letter's approve/reject in parallel via Promise.allSettled
 * and report how many of each succeeded, rather than assuming an
 * all-or-nothing batch call.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { FilterBar, FilterField } from '../../components/ui/FilterBar';
import { PriorityBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useToast } from '../../components/ui/Toast/useToast';
import { useConfirm } from '../../components/ui/Modal/useConfirm';
import { approveLetter, fetchLetters, rejectLetter } from '../../services/letterService';
import { extractErrorMessage } from '../../services/apiClient';
import { formatCurrency, formatDateTime } from '../../utils/format';

const LARGE_PAGE_SIZE = 1000;

export function PendingApprovalsPage() {
  const { data, isLoading, error, reload } = useAsyncData(
    () => fetchLetters({ status: 'Pending_Approval', limit: LARGE_PAGE_SIZE }),
    []
  );
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [actingOnId, setActingOnId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | null>(null);
  const [search, setSearch] = useState('');

  const letters = data?.letters ?? [];
  const isBusy = actingOnId !== null || bulkAction !== null;

  // Client-side, same as LettersListPage's search box - the API has no
  // full-text `search` param, and every pending letter is already
  // fetched in one page (LARGE_PAGE_SIZE) for the checkbox/bulk-action
  // flow above, so there's no extra request to make here.
  const filteredLetters = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return letters;
    return letters.filter(
      (letter) =>
        letter.trackingId.toLowerCase().includes(needle) ||
        letter.recipientName.toLowerCase().includes(needle) ||
        letter.subject.toLowerCase().includes(needle)
    );
  }, [letters, search]);

  const allSelected = filteredLetters.length > 0 && filteredLetters.every((letter) => selectedIds.has(letter.id));

  function toggleOne(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // "Select all" only selects what's currently visible (i.e. matching
  // the search box), not every pending letter across the whole module.
  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(filteredLetters.map((letter) => letter.id)));
  }

  async function handleApprove(letterId: string, trackingId: string) {
    const ok = await confirm({ message: `Approve letter ${trackingId}?` });
    if (!ok) return;
    setActingOnId(letterId);
    try {
      await approveLetter(letterId);
      showToast('success', `${trackingId} approved.`);
      reload();
    } catch (err) {
      showToast('error', extractErrorMessage(err));
    } finally {
      setActingOnId(null);
    }
  }

  async function handleReject(letterId: string, trackingId: string) {
    const ok = await confirm({
      title: 'Reject Letter',
      message: `Reject letter ${trackingId}? This cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Reject',
    });
    if (!ok) return;
    setActingOnId(letterId);
    try {
      await rejectLetter(letterId);
      showToast('success', `${trackingId} rejected.`);
      reload();
    } catch (err) {
      showToast('error', extractErrorMessage(err));
    } finally {
      setActingOnId(null);
    }
  }

  async function handleBulkApprove() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    const ok = await confirm({ message: `Approve ${ids.length} selected letter(s)?` });
    if (!ok) return;
    await runBulk('approve', ids, approveLetter);
  }

  async function handleBulkReject() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    const ok = await confirm({
      title: 'Reject Letters',
      message: `Reject ${ids.length} selected letter(s)? This cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Reject',
    });
    if (!ok) return;
    await runBulk('reject', ids, rejectLetter);
  }

  async function runBulk(action: 'approve' | 'reject', ids: string[], run: (id: string) => Promise<unknown>) {
    setBulkAction(action);
    try {
      const results = await Promise.allSettled(ids.map((id) => run(id)));
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.length - succeeded;
      const verb = action === 'approve' ? 'approved' : 'rejected';
      if (failed === 0) {
        showToast('success', `${succeeded} letter(s) ${verb}.`);
      } else {
        showToast('warning', `${succeeded} letter(s) ${verb}, ${failed} failed.`);
      }
      setSelectedIds(new Set());
      reload();
    } finally {
      setBulkAction(null);
    }
  }

  return (
    <AppShell pageTitle="Pending Approvals" pendingApprovalsCount={letters.length}>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Pending Approvals</h1>
            <p>Review newly registered letters and approve or reject them.</p>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger">
            <i className="fas fa-circle-exclamation" />
            <span>{error}</span>
          </div>
        )}

        {!isLoading && !error && letters.length > 0 && (
          <FilterBar resultsLabel={`${filteredLetters.length} of ${letters.length} letter(s)`}>
            <FilterField label="Search:">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tracking ID, recipient, or subject…"
                aria-label="Search pending letters"
              />
            </FilterField>
          </FilterBar>
        )}

        {!isLoading && !error && letters.length > 0 && (
          <div className="card batch-actions-bar">
            <div>
              <label className="checkbox-label">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} disabled={isBusy} />
                <span>{selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}</span>
              </label>
              <div>
                <Button
                  variant="success"
                  size="sm"
                  disabled={selectedIds.size === 0}
                  isLoading={bulkAction === 'approve'}
                  onClick={handleBulkApprove}
                >
                  <i className="fas fa-check" /> Approve Selected
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={selectedIds.size === 0}
                  isLoading={bulkAction === 'reject'}
                  onClick={handleBulkReject}
                >
                  <i className="fas fa-times" /> Reject Selected
                </Button>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && (
          <Card>
            <CardHeader title={`${filteredLetters.length} letter(s) awaiting review`} />
            <CardBody>
              {letters.length === 0 ? (
                <EmptyState icon="fa-check-circle" title="All caught up" description="No letters are waiting for approval right now." />
              ) : filteredLetters.length === 0 ? (
                <EmptyState
                  icon="fa-magnifying-glass"
                  title="No matching letters"
                  description={`No pending letters match "${search}". Try a different search.`}
                />
              ) : (
                filteredLetters.map((letter) => (
                  <div className="approval-card" key={letter.id}>
                    <div className="approval-header">
                      <div className="approval-info">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(letter.id)}
                          onChange={() => toggleOne(letter.id)}
                          disabled={isBusy}
                          aria-label={`Select ${letter.trackingId}`}
                        />
                        <div>
                          <h3>
                            <Link to={`/letters/${letter.id}`}>{letter.trackingId}</Link>
                          </h3>
                          <span className="secondary-text">{letter.recipientName} - {letter.subject}</span>
                        </div>
                      </div>
                      <PriorityBadge priority={letter.priority} />
                    </div>

                    <div className="approval-details">
                      <div className="detail-item">
                        <span className="detail-label">Directorate</span>
                        <span className="detail-value">{letter.senderDirectorate?.name ?? '—'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Liability</span>
                        <span className="detail-value">{formatCurrency(letter.liabilityValue)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Submitted</span>
                        <span className="detail-value">{formatDateTime(letter.createdAt)}</span>
                      </div>
                    </div>

                    <div className="approval-actions">
                      <Button
                        variant="success"
                        size="sm"
                        disabled={bulkAction !== null}
                        isLoading={actingOnId === letter.id}
                        onClick={() => handleApprove(letter.id, letter.trackingId)}
                      >
                        <i className="fas fa-check" /> Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={bulkAction !== null}
                        isLoading={actingOnId === letter.id}
                        onClick={() => handleReject(letter.id, letter.trackingId)}
                      >
                        <i className="fas fa-times" /> Reject
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
