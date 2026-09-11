/**
 * "Courier Allocation" - merges what used to be two separate pages
 * (AssignmentsPage and BulkAutoAssignPage, both deleted) into one
 * module per product decision: pick one courier manually, or hand a
 * batch to the load-balancing auto-allocate endpoint, off the same
 * Approved-letters list rather than showing it twice.
 *
 * Scoped to Approved letters only - once a letter is actually assigned
 * a courier (status moves to Assigned), it drops off this page
 * immediately, since assigning is this page's one job. Everything
 * after that (marking in transit, delivered/undelivered) already has
 * its own admin actions on LetterDetailPage, keyed off the letter's
 * current status the same way this page's actions were - no need to
 * duplicate that lifecycle tracking here too.
 *
 * Ports pages/admin/assignments.php's allocation half and
 * pages/admin/bulk-assign.php (POST /letters/auto-allocate, the API
 * doc's "background" load-balancing engine) - not the in-transit/
 * delivered half of assignments.php, which lives on LetterDetailPage
 * instead.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge, PriorityBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useToast } from '../../components/ui/Toast/useToast';
import { useConfirm } from '../../components/ui/Modal/useConfirm';
import { allocateLetterToCourier, autoAllocateLetters, fetchLetters } from '../../services/letterService';
import { fetchCouriers } from '../../services/courierService';
import { extractErrorMessage } from '../../services/apiClient';
import { formatCurrency } from '../../utils/format';
import { requiresDhl } from '../../utils/courierRouting';
import type { AutoAllocateResponse, Letter } from '../../types/api';

const LARGE_PAGE_SIZE = 1000;

export function CourierAllocationPage() {
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [actingOnId, setActingOnId] = useState<string | null>(null);
  const [selectedCourier, setSelectedCourier] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<AutoAllocateResponse | null>(null);

  const lettersQuery = useAsyncData(() => fetchLetters({ status: 'Approved', limit: LARGE_PAGE_SIZE }), []);
  const couriersQuery = useAsyncData(() => fetchCouriers(), []);

  const letters = lettersQuery.data?.letters ?? [];
  const availableCouriers = (couriersQuery.data ?? []).filter((courier) => courier.availability);
  const isBusy = actingOnId !== null || isBulkSubmitting;
  const allSelected = letters.length > 0 && selectedIds.size === letters.length;

  function toggleOne(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(letters.map((letter) => letter.id)));
  }

  async function handleAutoAssign(ids: string[]) {
    if (ids.length === 0) {
      showToast('warning', 'No letters to assign.');
      return;
    }
    const ok = await confirm({ message: `Auto-assign ${ids.length} letter(s) to couriers? High-priority or >₦25,000,000 letters go to DHL automatically.` });
    if (!ok) return;

    setIsBulkSubmitting(true);
    try {
      const result = await autoAllocateLetters({ letterIds: ids });
      setLastResult(result);
      showToast('success', result.message);
      setSelectedIds(new Set());
      lettersQuery.reload();
    } catch (err) {
      showToast('error', extractErrorMessage(err));
    } finally {
      setIsBulkSubmitting(false);
    }
  }

  async function handleAllocate(letter: Letter) {
    const courierId = selectedCourier[letter.id];
    if (!courierId) {
      showToast('warning', 'Choose a courier first.');
      return;
    }
    setActingOnId(letter.id);
    try {
      await allocateLetterToCourier(letter.id, courierId);
      showToast('success', `${letter.trackingId} assigned.`);
      lettersQuery.reload();
    } catch (err) {
      showToast('error', extractErrorMessage(err));
    } finally {
      setActingOnId(null);
    }
  }

  const isLoading = lettersQuery.isLoading || couriersQuery.isLoading;
  const error = lettersQuery.error ?? couriersQuery.error;

  return (
    <AppShell pageTitle="Courier Allocation">
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Courier Allocation</h1>
            <p>Assign couriers to approved letters, manually or via load-balanced auto-assign.</p>
          </div>
        </div>

        {lastResult && (
          <div className={`alert ${lastResult.skipped > 0 ? 'alert-warning' : 'alert-success'}`}>
            <i className={`fas ${lastResult.skipped > 0 ? 'fa-triangle-exclamation' : 'fa-check-circle'}`} />
            <span>
              {lastResult.message} — {lastResult.processing} processing, {lastResult.skipped} skipped.
            </span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger">
            <i className="fas fa-circle-exclamation" />
            <span>{error}</span>
          </div>
        )}

        <Card>
          <CardHeader
            title="Auto-Assign"
            action={
              <Button variant="primary" isLoading={isBulkSubmitting} onClick={() => handleAutoAssign(letters.map((l) => l.id))}>
                <i className="fas fa-magic" /> Auto-Assign All ({letters.length})
              </Button>
            }
          />
          <CardBody>
            <p className="secondary-text">
              High-priority or liability-over-₦25,000,000 letters always route to DHL (see the "DHL Priority" tag
              below); everything else load-balances across available couriers by current workload.
            </p>
          </CardBody>
        </Card>

        {!isLoading && !error && letters.length > 0 && (
          <div className="card batch-actions-bar">
            <div>
              <label className="checkbox-label">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} disabled={isBusy} />
                <span>{selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}</span>
              </label>
              <div>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={selectedIds.size === 0}
                  isLoading={isBulkSubmitting}
                  onClick={() => handleAutoAssign([...selectedIds])}
                >
                  Assign Selected
                </Button>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && (
          <Card>
            <CardHeader title={`${letters.length} letter(s) awaiting courier assignment`} />
            <CardBody>
              {letters.length === 0 ? (
                <EmptyState icon="fa-truck" title="Nothing to assign" description="No approved letters are waiting for a courier right now." />
              ) : (
                letters.map((letter) => (
                  <div className="assignment-card" key={letter.id}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(letter.id)}
                      onChange={() => toggleOne(letter.id)}
                      disabled={isBusy}
                      aria-label={`Select ${letter.trackingId} for auto-assign`}
                      style={{ marginRight: 16 }}
                    />

                    <div className="assignment-info">
                      <h3>
                        <Link to={`/letters/${letter.id}`}>{letter.trackingId}</Link>
                      </h3>
                      <p>{letter.recipientName} - {letter.subject} - {formatCurrency(letter.liabilityValue)}</p>
                      <div className="flex-row gap-sm mt-sm">
                        <PriorityBadge priority={letter.priority} />
                        {requiresDhl(letter) && (
                          <Badge kind="status" color="purple">
                            DHL Priority
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="assignment-actions">
                      <div className="inline-form">
                        <select
                          value={selectedCourier[letter.id] ?? ''}
                          onChange={(e) => setSelectedCourier((current) => ({ ...current, [letter.id]: e.target.value }))}
                          aria-label={`Choose courier for ${letter.trackingId}`}
                          disabled={isBusy}
                        >
                          <option value="">Choose courier…</option>
                          {availableCouriers.map((courier) => (
                            <option key={courier.id} value={courier.id}>
                              {courier.name}
                            </option>
                          ))}
                        </select>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={isBulkSubmitting}
                          isLoading={actingOnId === letter.id}
                          onClick={() => handleAllocate(letter)}
                        >
                          Assign
                        </Button>
                      </div>
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
