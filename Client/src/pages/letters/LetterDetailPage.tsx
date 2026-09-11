/**
 * Port of the PHP app's pages/letters/show.php - full letter details
 * plus its status timeline (styles/app.css's .details-grid / .timeline
 * family). Status-transition actions (approve/reject/allocate/mark
 * in-transit/delivered/undelivered) live here too, guarded by role AND
 * current status, mirroring the PHP app's approach of only showing the
 * button that's actually valid for where the letter is in its
 * lifecycle.
 *
 * This is deliberately ONE page shared by admins and couriers rather
 * than a parallel courier-only detail screen. The delivery transitions
 * are identical for both (same three endpoints, which server-side
 * accept `restrictTo("Courier", "Admin")`), so duplicating them would
 * mean two places to keep the status gating correct. What differs is
 * scoped narrowly instead:
 *   - approve/reject/allocate stay Admin+Management only;
 *   - couriers must attach a POD photo to complete a delivery, admins
 *     recording one second-hand may submit without;
 *   - the back link points wherever that role came from.
 * A courier reaching a letter that isn't theirs is already 403'd by the
 * API (see get_letter's courier check), so there's no client-side
 * ownership test here - the error surfaces through the normal path.
 */
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PodUploadModal } from '../../components/letters/PodUploadModal';
import { UndeliveredReasonModal } from '../../components/letters/UndeliveredReasonModal';
import { useAuth } from '../../hooks/useAuth';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useToast } from '../../components/ui/Toast/useToast';
import { useConfirm } from '../../components/ui/Modal/useConfirm';
import {
  approveLetter,
  fetchLetter,
  markLetterDelivered,
  markLetterInTransit,
  markLetterUndelivered,
  podImageUrl,
  rejectLetter,
} from '../../services/letterService';
import { extractErrorMessage } from '../../services/apiClient';
import { formatCurrency, formatDateTime, formatLga } from '../../utils/format';
import { isDirectorateRestricted } from '../../utils/permissions';

export function LetterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [isActing, setIsActing] = useState(false);
  const [podModalOpen, setPodModalOpen] = useState(false);
  const [undeliveredModalOpen, setUndeliveredModalOpen] = useState(false);

  const { data: fetchedLetter, isLoading, error, reload } = useAsyncData(() => fetchLetter(id!), [id]);

  // GET /letters/:id has no directorate scoping (unlike GET /letters -
  // see permissions.ts), so a directorate-restricted user who guesses/
  // types another directorate's letter URL directly must still be
  // blocked here, same as if the letter didn't exist.
  const isAccessible =
    !fetchedLetter || !user || !isDirectorateRestricted(user.role) || fetchedLetter.senderDirectorateId === user.directorateId;
  const letter = isAccessible ? fetchedLetter : undefined;

  const isAdmin = user?.role === 'Admin' || user?.role === 'Management';
  const isCourier = user?.role === 'Courier';
  /** Who sees the pickup/delivery buttons at all. Matches the server's
   *  `restrictTo("Courier", "Admin")` on those three routes. */
  const canRunDeliveryActions = isAdmin || isCourier;
  const podUrl = podImageUrl(letter?.podImagePath);

  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    setIsActing(true);
    try {
      await action();
      showToast('success', successMessage);
      reload();
      return true;
    } catch (err) {
      showToast('error', extractErrorMessage(err));
      return false;
    } finally {
      setIsActing(false);
    }
  }

  async function handleApprove() {
    if (!letter) return;
    const ok = await confirm({ message: `Approve letter ${letter.trackingId}?` });
    if (ok) runAction(() => approveLetter(letter.id), 'Letter approved.');
  }

  async function handleReject() {
    if (!letter) return;
    const ok = await confirm({
      title: 'Reject Letter',
      message: `Reject letter ${letter.trackingId}? This cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Reject',
    });
    if (ok) runAction(() => rejectLetter(letter.id), 'Letter rejected.');
  }

  async function handleInTransit() {
    if (!letter) return;
    runAction(() => markLetterInTransit(letter.id), 'Marked as in transit.');
  }

  // Delivered/undelivered each collect something before firing (a POD
  // photo, a failure reason), so they open a dedicated dialog instead
  // of the generic yes/no confirm the other transitions use.
  async function handleDeliveredConfirmed(photo: File | null) {
    if (!letter) return;
    const succeeded = await runAction(
      () => markLetterDelivered(letter.id, photo),
      'Delivery confirmed. Thank you!'
    );
    if (succeeded) setPodModalOpen(false);
  }

  async function handleUndeliveredConfirmed(reason: string) {
    if (!letter) return;
    const succeeded = await runAction(
      () => markLetterUndelivered(letter.id, { reason }),
      'Marked as undelivered.'
    );
    if (succeeded) setUndeliveredModalOpen(false);
  }

  return (
    <AppShell pageTitle={letter?.trackingId ?? 'Letter Details'}>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>{letter ? letter.trackingId : 'Letter Details'}</h1>
            <p>{letter?.subject}</p>
          </div>
          {/* Couriers have no /letters access - that page lists every
              directorate's mail. Send them back to their own queue. */}
          <Link to={isCourier ? '/my-deliveries' : '/letters'} className="btn btn-secondary btn-sm">
            <i className="fas fa-arrow-left" /> {isCourier ? 'Back to My Deliveries' : 'Back to All Letters'}
          </Link>
        </div>

        {error && (
          <div className="alert alert-danger">
            <i className="fas fa-circle-exclamation" />
            <span>{error}</span>
          </div>
        )}

        {!isLoading && !error && letter && (
          <>
            <Card>
              <CardHeader
                title="Letter Details"
                action={
                  <div className="flex-row gap-sm">
                    <StatusBadge status={letter.status} large />
                    <PriorityBadge priority={letter.priority} large />
                  </div>
                }
              />
              <CardBody>
                <div className="details-grid">
                  <DetailItem label="Recipient" value={letter.recipientName} />
                  <DetailItem label="Recipient Address" value={letter.recipientAddress} />
                  <DetailItem label="Delivery LGA" value={formatLga(letter.lgaAddress)} />
                  <DetailItem label="Directorate" value={letter.senderDirectorate ? `${letter.senderDirectorate.name} (${letter.senderDirectorate.code})` : '—'} />
                  <DetailItem label="Liability Value" value={formatCurrency(letter.liabilityValue)} />
                  <DetailItem label="Created By" value={letter.createdBy?.name ?? '—'} />
                  <DetailItem label="Created At" value={formatDateTime(letter.createdAt)} />
                  <DetailItem label="Approved By" value={letter.approvedBy?.name ?? '—'} />
                  <DetailItem label="Approved At" value={formatDateTime(letter.approvedAt)} />
                  <DetailItem label="Courier" value={letter.courier?.name ?? 'Not yet assigned'} />
                  <DetailItem label="Delivered At" value={formatDateTime(letter.deliveredAt)} />
                  {letter.notes && <DetailItem label="Notes" value={letter.notes} fullWidth />}
                </div>

                {/* Approval/allocation stays Admin+Management: those
                    endpoints don't accept Courier at all. */}
                {isAdmin && (letter.status === 'Pending_Approval' || letter.status === 'Approved') && (
                  <div className="approval-actions mt-lg">
                    {letter.status === 'Pending_Approval' && (
                      <>
                        <Button variant="success" onClick={handleApprove} isLoading={isActing}>
                          <i className="fas fa-check" /> Approve
                        </Button>
                        <Button variant="danger" onClick={handleReject} isLoading={isActing}>
                          <i className="fas fa-times" /> Reject
                        </Button>
                      </>
                    )}
                    {letter.status === 'Approved' && (
                      <Link to="/admin/courier-allocation" className="btn btn-primary">
                        <i className="fas fa-user-check" /> Assign a Courier
                      </Link>
                    )}
                  </div>
                )}

                {/* Delivery transitions - shared by couriers and admins.
                    Gated on status so only the move that's actually
                    valid from here is offered. */}
                {canRunDeliveryActions && (letter.status === 'Assigned' || letter.status === 'In_Transit') && (
                  <div className="approval-actions delivery-actions mt-lg">
                    {letter.status === 'Assigned' && (
                      <Button variant="primary" onClick={handleInTransit} isLoading={isActing} block={isCourier}>
                        <i className="fas fa-shipping-fast" /> Mark In Transit
                      </Button>
                    )}
                    {letter.status === 'In_Transit' && (
                      <>
                        <Button
                          variant="success"
                          onClick={() => setPodModalOpen(true)}
                          disabled={isActing}
                          block={isCourier}
                        >
                          <i className="fas fa-camera" /> Mark Delivered
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => setUndeliveredModalOpen(true)}
                          disabled={isActing}
                          block={isCourier}
                        >
                          <i className="fas fa-times-circle" /> Mark Undelivered
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>

            {podUrl && (
              <Card>
                <CardHeader title="Proof of Delivery" />
                <CardBody>
                  {/* Opens full-size in a new tab - on a phone that's
                      the native image viewer, with pinch-zoom, which
                      beats anything re-implemented in-page. */}
                  <a href={podUrl} target="_blank" rel="noopener noreferrer" className="pod-evidence-link">
                    <img src={podUrl} alt={`Proof of delivery for ${letter.trackingId}`} className="pod-evidence" />
                  </a>
                  <p className="secondary-text mt-sm">
                    Captured {formatDateTime(letter.deliveredAt)}. Tap the photo to view full size.
                  </p>
                </CardBody>
              </Card>
            )}

            <Card>
              <CardHeader title="Status Timeline" />
              <CardBody>
                <div className="timeline">
                  {(letter.timelines ?? []).map((entry, index) => (
                    <div className="timeline-item" key={entry.id ?? index}>
                      <div className="timeline-marker" />
                      <div className="timeline-content">
                        <span className="timeline-status">{entry.status}</span>
                        <span className="timeline-description">{entry.description}</span>
                        <span className="timeline-time">{formatDateTime(entry.createdAt)}</span>
                        <span className="timeline-user">by {entry.user?.name ?? 'System'}</span>
                      </div>
                    </div>
                  ))}
                  {(letter.timelines ?? []).length === 0 && (
                    <p className="secondary-text">No timeline events recorded yet.</p>
                  )}
                </div>
              </CardBody>
            </Card>
          </>
        )}

        {!isLoading && !error && !letter && (
          <div className="alert alert-warning">
            <i className="fas fa-triangle-exclamation" />
            <span>
              Letter not found.{' '}
              <button
                type="button"
                className="btn-link-muted"
                onClick={() => navigate(isCourier ? '/my-deliveries' : '/letters')}
              >
                {isCourier ? 'Back to My Deliveries' : 'Back to All Letters'}
              </button>
            </span>
          </div>
        )}

        {letter && (
          <>
            <PodUploadModal
              isOpen={podModalOpen}
              trackingId={letter.trackingId}
              requirePhoto={isCourier}
              isSubmitting={isActing}
              onCancel={() => setPodModalOpen(false)}
              onConfirm={handleDeliveredConfirmed}
            />
            <UndeliveredReasonModal
              isOpen={undeliveredModalOpen}
              trackingId={letter.trackingId}
              isSubmitting={isActing}
              onCancel={() => setUndeliveredModalOpen(false)}
              onConfirm={handleUndeliveredConfirmed}
            />
          </>
        )}
      </div>
    </AppShell>
  );
}

function DetailItem({ label, value, fullWidth }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <div className={`detail-item${fullWidth ? ' full-width' : ''}`}>
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  );
}
