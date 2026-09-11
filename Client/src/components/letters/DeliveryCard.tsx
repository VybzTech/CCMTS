/**
 * One assigned delivery, as a courier sees it in a list.
 *
 * Deliberately a card rather than a DataTable row. The letters table
 * (.data-table in styles/app.css) carries `min-width: 800px` and sits
 * in a horizontally scrolling wrapper, which is fine on a desk and
 * miserable on a phone - a rider would be swiping sideways to read an
 * address. `.assignment-card` already flips to a stacked column layout
 * under 768px (see the responsive section of app.css), so this reuses
 * that instead of introducing a second table style.
 *
 * The whole card is the tap target, not just the tracking ID: thumb
 * accuracy on a moving okada is not something to design around.
 */
import { Link } from 'react-router-dom';
import { StatusBadge, PriorityBadge } from '../ui/Badge';
import { formatLga } from '../../utils/format';
import type { Letter } from '../../types/api';

export function DeliveryCard({ letter }: { letter: Letter }) {
  return (
    <Link to={`/letters/${letter.id}`} className="assignment-card delivery-card">
      <div className="assignment-info">
        <div className="flex-row gap-sm mb-sm">
          <span className="tracking-id">{letter.trackingId}</span>
          <StatusBadge status={letter.status} />
          <PriorityBadge priority={letter.priority} />
        </div>

        <h3>{letter.recipientName}</h3>

        <p className="delivery-address">
          <i className="fas fa-location-dot" aria-hidden="true" /> {letter.recipientAddress}
        </p>
        <p className="secondary-text">
          <i className="fas fa-map" aria-hidden="true" /> {formatLga(letter.lgaAddress)}
          {letter.subject ? ` · ${letter.subject}` : ''}
        </p>
      </div>

      <div className="assignment-actions">
        <span className="btn btn-primary btn-sm delivery-card-cta">
          {letter.status === 'Assigned' ? 'Start Delivery' : 'Open'}{' '}
          <i className="fas fa-chevron-right" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
