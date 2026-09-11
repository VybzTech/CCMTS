/**
 * Wraps styles/app.css's .action-card - the horizontal "menu row"
 * quick-action tiles on dashboards (Register Letter, View All,
 * Pending Approvals, etc.). Deliberately a different visual language
 * from StatCard (see the app.css comment above .action-card) so a
 * number-reporting tile and a clickable-menu tile never look
 * interchangeable.
 */
import { Link } from 'react-router-dom';

interface ActionCardProps {
  to: string;
  icon: string;
  label: string;
  /** e.g. a pending-approvals count - renders as the same
   *  .badge pill used elsewhere, positioned by the CSS. */
  badge?: React.ReactNode;
}

export function ActionCard({ to, icon, label, badge }: ActionCardProps) {
  return (
    <Link to={to} className="action-card">
      <i className={`fas ${icon}`} aria-hidden="true" />
      <span>{label}</span>
      {badge !== undefined && badge !== null && <span className="badge">{badge}</span>}
    </Link>
  );
}
