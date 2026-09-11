/**
 * Small presentation-only helpers shared across pages. Nothing here
 * talks to the API - these just turn raw API values into what the
 * PHP app's screens showed, so the same numbers/labels look the same.
 */

/** Mirrors includes/functions.php's format_currency() in the PHP app -
 *  liabilityValue arrives from the API as a string (see types/api.ts),
 *  so this accepts either. */
export function formatCurrency(amount: string | number): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  const safeValue = Number.isFinite(value) ? value : 0;
  return (
    '₦' +
    safeValue.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

/** Turns the API's underscored enum values ("Pending_Approval",
 *  "In_Transit") into the spaced labels the PHP app's badges used
 *  ("Pending Approval", "In Transit"), without changing the underlying
 *  value anywhere it's used for comparisons/filtering. */
export function formatStatusLabel(status: string): string {
  return status.replace(/_/g, ' ');
}

/** The color modifiers Badge.tsx/styles/app.css actually support -
 *  shared here (rather than declared in components/ui/Badge.tsx) so
 *  this file's mapping functions can return a real literal type instead
 *  of a bare `string`, and Badge.tsx imports this instead of the other
 *  way around (a components file depending on a utils file, not vice
 *  versa). */
export type BadgeColor = 'warning' | 'info' | 'purple' | 'cyan' | 'success' | 'danger' | 'secondary';

/** Maps a letter status to the badge color class already defined in
 *  styles/app.css (.status-badge.warning / .info / .purple / .cyan /
 *  .success / .danger) - keep this in sync if new statuses are added. */
export function statusBadgeClass(status: string): BadgeColor {
  switch (status) {
    case 'Pending_Approval':
      return 'warning';
    case 'Approved':
      return 'info';
    case 'Assigned':
      return 'purple';
    case 'In_Transit':
      return 'cyan';
    case 'Delivered':
      return 'success';
    case 'Undelivered':
      return 'danger';
    default:
      return 'secondary';
  }
}

/** Maps a letter priority to a badge color class. The API doc's three
 *  levels (Low/Medium/High) don't map 1:1 onto the PHP app's two
 *  (Normal/Urgent + DHL routing), so this is a fresh, simpler mapping:
 *  Low reads as informational, Medium as neutral/default, High as the
 *  same red the PHP app used for "Urgent". */
export function priorityBadgeClass(priority: string): BadgeColor {
  switch (priority) {
    case 'Low':
      return 'info';
    case 'High':
      return 'danger';
    case 'Medium':
    default:
      return 'secondary';
  }
}

/** Turns the API's screaming-snake LGA values into readable place
 *  names ("VICTORIA_ISLAND" -> "Victoria Island"). `NOT_LAGOS` is the
 *  out-of-state catch-all rather than a real LGA, so it gets a label
 *  that reads as one ("Outside Lagos") instead of the literal
 *  "Not Lagos", which scans as a mistake on a delivery card. */
export function formatLga(lga: string | null | undefined): string {
  if (!lga) return '—';
  if (lga === 'NOT_LAGOS') return 'Outside Lagos';
  return lga
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

/** e.g. "ODU" stays as-is but a hypothetical multi-word role would get
 *  spaced out - the raw UserRole value
 *  stays un-spaced everywhere it's compared/filtered (routes, nav
 *  config), this only touches what's actually rendered on screen. */
export function formatRoleLabel(role: string): string {
  return role.replace(/([a-z])([A-Z])/g, '$1 $2');
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
