/**
 * Wraps styles/app.css's .stat-card (left accent stripe + corner icon,
 * see app.css section 7 "Stats Grid" for the full rationale comment).
 * The DOM order here matters less than usual - the CSS uses `order`
 * on .stat-icon to visually place it above the value regardless of
 * where it sits in markup, so just render icon/value/label/sublabel in
 * any order and the CSS positions them.
 */
export type StatAccent = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'cyan';

interface StatCardProps {
  accent: StatAccent;
  icon: string;
  value: React.ReactNode;
  label: string;
  sublabel?: string;
  large?: boolean;
}

export function StatCard({ accent, icon, value, label, sublabel, large }: StatCardProps) {
  return (
    <div className={`stat-card accent-${accent}${large ? ' large' : ''}`}>
      <div className={`stat-icon ${accent}`}>
        <i className={`fas ${icon}`} aria-hidden="true" />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sublabel && <div className="stat-sublabel">{sublabel}</div>}
    </div>
  );
}
