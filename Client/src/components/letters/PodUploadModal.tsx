/**
 * Capture-and-confirm dialog for proof of delivery, used by
 * LetterDetailPage when a courier (or an Admin acting on their behalf)
 * marks a letter delivered.
 *
 * Built for a phone first, since the whole reason this exists is that
 * the native courier app was deferred in favour of riders using the web
 * client in the field:
 *   - `capture="environment"` makes a phone open the rear camera
 *     straight away instead of a file browser; desktop browsers ignore
 *     the attribute and show a normal file picker, so one input serves
 *     both.
 *   - The file is validated against the server's own limits
 *     (validatePodImage) before any upload starts - a rider on mobile
 *     data shouldn't burn 30 seconds discovering the photo was 8MB.
 *   - The whole tap target is a <label>, so there's no small "Browse"
 *     button to hit accurately one-handed.
 */
import { useEffect, useRef, useState } from 'react';
import { Modal } from '../ui/Modal/Modal';
import { Button } from '../ui/Button';
import { validatePodImage } from '../../services/letterService';

interface PodUploadModalProps {
  isOpen: boolean;
  trackingId: string;
  /** Couriers must attach a photo - that's the point of the feature.
   *  Admins recording a delivery reported to them by phone can submit
   *  without one, which the backend also allows (podImagePath is
   *  nullable). */
  requirePhoto: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: (photo: File | null) => void;
}

export function PodUploadModal({
  isOpen,
  trackingId,
  requirePhoto,
  isSubmitting,
  onCancel,
  onConfirm,
}: PodUploadModalProps) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset every time the dialog is reopened, so a previous letter's
  // photo can never be submitted against a different letter.
  useEffect(() => {
    if (!isOpen) {
      setPhoto(null);
      setError(null);
    }
  }, [isOpen]);

  // Object URLs leak until explicitly revoked - tie each one's lifetime
  // to the file it previews rather than to the component.
  useEffect(() => {
    if (!photo) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setPhoto(null);
      setError(null);
      return;
    }

    const validationError = validatePodImage(file);
    if (validationError) {
      setPhoto(null);
      setError(validationError);
      // Clear the input too, or picking the *same* bad file again
      // wouldn't re-fire onChange and the error would look stuck.
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setError(null);
    setPhoto(file);
  }

  function handleConfirm() {
    if (requirePhoto && !photo) {
      setError('A proof-of-delivery photo is required to complete this delivery.');
      return;
    }
    onConfirm(photo);
  }

  return (
    <Modal isOpen={isOpen} onClose={onCancel} closeOnBackdropClick={!isSubmitting}>
      <div className="modal-icon success">
        <i className="fas fa-camera" aria-hidden="true" />
      </div>
      <h3>Confirm Delivery</h3>
      <p>
        Attach a photo showing {trackingId} was handed over — a signed receipt, or the item with the
        recipient.
      </p>

      <div className="pod-upload">
        {/* Input first, label second: the visually-hidden input stays in
            the tab order, and `.pod-file-input:focus-visible +
            .pod-dropzone` in app.css can only put a focus ring on the
            label if the label is its next sibling. */}
        <input
          ref={inputRef}
          id="pod-image-input"
          className="pod-file-input"
          type="file"
          name="pod_image"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          disabled={isSubmitting}
        />
        <label className="pod-dropzone" htmlFor="pod-image-input">
          {previewUrl ? (
            <img src={previewUrl} alt="Proof of delivery preview" className="pod-preview" />
          ) : (
            <>
              <i className="fas fa-camera" aria-hidden="true" />
              <span className="pod-dropzone-label">Take photo or choose file</span>
              <span className="pod-dropzone-hint">JPG or PNG, up to 5MB</span>
            </>
          )}
        </label>

        {photo && (
          <p className="pod-filename">
            <i className="fas fa-paperclip" aria-hidden="true" /> {photo.name}
            <button
              type="button"
              className="btn-link-muted"
              onClick={() => {
                setPhoto(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
              disabled={isSubmitting}
            >
              Retake
            </button>
          </p>
        )}

        {error && <span className="error-text">{error}</span>}
      </div>

      <div className="modal-actions">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="success" onClick={handleConfirm} isLoading={isSubmitting}>
          <i className="fas fa-check-circle" /> Mark Delivered
        </Button>
      </div>
    </Modal>
  );
}
