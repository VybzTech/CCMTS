/**
 * Asks why a delivery failed before marking a letter Undelivered.
 *
 * The reason isn't cosmetic: the backend writes it straight into the
 * letter's timeline as that entry's `description` (falling back to a
 * bare "Delivery failed" when omitted) and into the notification the
 * originating ODU user receives - see mark_undelivered in
 * Server/src/controllers/letter.controller.js. Since `Undelivered` is a
 * terminal status with no distinct "Rejected" counterpart (see the
 * LetterStatus comment in types/api.ts), this text is the only record
 * of *why* a letter ended up there, so the field is required here even
 * though the API treats it as optional.
 *
 * The quick-pick buttons cover the failure modes riders actually hit,
 * so the common case is one tap rather than typing an explanation on a
 * phone keyboard while standing in the street.
 */
import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal/Modal';
import { Button } from '../ui/Button';
import { TextareaField } from '../ui/form/TextareaField';

const COMMON_REASONS = [
  'Recipient not available',
  'Address could not be found',
  'Recipient refused delivery',
  'Office closed',
  'Access denied to premises',
];

interface UndeliveredReasonModalProps {
  isOpen: boolean;
  trackingId: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

export function UndeliveredReasonModal({
  isOpen,
  trackingId,
  isSubmitting,
  onCancel,
  onConfirm,
}: UndeliveredReasonModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setReason('');
      setError(null);
    }
  }, [isOpen]);

  function handleConfirm() {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('Please give a reason — it becomes the permanent record of why this failed.');
      return;
    }
    onConfirm(trimmed);
  }

  return (
    <Modal isOpen={isOpen} onClose={onCancel} closeOnBackdropClick={!isSubmitting}>
      <div className="modal-icon danger">
        <i className="fas fa-triangle-exclamation" aria-hidden="true" />
      </div>
      <h3>Mark Undelivered</h3>
      <p>Record why {trackingId} could not be delivered.</p>

      <div className="reason-quick-picks">
        {COMMON_REASONS.map((preset) => (
          <button
            key={preset}
            type="button"
            className={`reason-chip${reason === preset ? ' selected' : ''}`}
            onClick={() => {
              setReason(preset);
              setError(null);
            }}
            disabled={isSubmitting}
          >
            {preset}
          </button>
        ))}
      </div>

      <TextareaField
        label="Reason"
        name="reason"
        rows={3}
        value={reason}
        placeholder="Add or edit the reason…"
        onChange={(event) => {
          setReason(event.target.value);
          setError(null);
        }}
        disabled={isSubmitting}
        error={error ?? undefined}
      />

      <div className="modal-actions">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleConfirm} isLoading={isSubmitting}>
          <i className="fas fa-times-circle" /> Mark Undelivered
        </Button>
      </div>
    </Modal>
  );
}
