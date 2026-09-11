/**
 * Wraps styles/app.css's .empty-state - used everywhere a list/table
 * has zero rows (no letters yet, no couriers yet, etc.), matching the
 * PHP app's repeated `<div class="empty-state"><i/><h3/><p/></div>`
 * markup block.
 */
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <i className={`fas ${icon}`} aria-hidden="true" />
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
