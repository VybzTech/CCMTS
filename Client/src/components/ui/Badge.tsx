/**
 * Wraps styles/app.css's .status-badge / .priority-badge families
 * (color modifiers: warning, info, purple, cyan, success, danger,
 * secondary; size modifier: large). StatusBadge/PriorityBadge below
 * are the ones page components should reach for - they derive the
 * color automatically from a Letter's status/priority via
 * utils/format.ts, so a new status/priority value only needs updating
 * in one place (statusBadgeClass/priorityBadgeClass) to show up
 * correctly everywhere.
 */
import type { ReactNode } from 'react';
import {
  formatStatusLabel,
  priorityBadgeClass,
  statusBadgeClass,
  type BadgeColor,
} from '../../utils/format';
import type { LetterPriority, LetterStatus } from '../../types/api';

export type { BadgeColor };

interface BadgeProps {
  kind: 'status' | 'priority';
  color: BadgeColor;
  large?: boolean;
  children: ReactNode;
}

/** Low-level primitive - prefer StatusBadge/PriorityBadge in page code
 *  unless you have a color/label combination those don't cover. */
export function Badge({ kind, color, large, children }: BadgeProps) {
  const baseClass = kind === 'status' ? 'status-badge' : 'priority-badge';
  return (
    <span className={`${baseClass} ${color}${large ? ' large' : ''}`}>{children}</span>
  );
}

export function StatusBadge({ status, large }: { status: LetterStatus; large?: boolean }) {
  return (
    <Badge kind="status" color={statusBadgeClass(status)} large={large}>
      {formatStatusLabel(status)}
    </Badge>
  );
}

export function PriorityBadge({ priority, large }: { priority: LetterPriority; large?: boolean }) {
  return (
    <Badge kind="priority" color={priorityBadgeClass(priority)} large={large}>
      {priority}
    </Badge>
  );
}
