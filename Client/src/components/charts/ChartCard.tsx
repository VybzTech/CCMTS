/**
 * Wraps styles/app.css's .chart-card / .chart-card-header /
 * .chart-container / .chart-empty-state. Put a chart component
 * (LineChart, BarChart, DoughnutChart - siblings in this folder) as
 * children, or pass isEmpty to show the same "no data yet" empty state
 * the PHP app's dashboard used instead of an axes-with-nothing-on-them
 * chart (see the design-audit note in the PHP app's app.css history for
 * why that mattered).
 */
import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  /** e.g. a period <select> - rendered next to the title, same slot
   *  the PHP app's delivery-trend "This Week / This Month" picker used. */
  headerAction?: ReactNode;
  isEmpty?: boolean;
  emptyMessage?: string;
  large?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

export function ChartCard({
  title,
  headerAction,
  isEmpty,
  emptyMessage = 'No data to display yet.',
  large,
  fullWidth,
  children,
}: ChartCardProps) {
  return (
    <div className={`chart-card${fullWidth ? ' full-width' : ''}`}>
      {headerAction ? (
        <div className="chart-card-header">
          <h3>{title}</h3>
          {headerAction}
        </div>
      ) : (
        <h3>{title}</h3>
      )}

      <div className={`chart-container${large ? ' large' : ''}`}>
        {isEmpty ? (
          <div className="chart-empty-state">
            <i className="fas fa-chart-line" aria-hidden="true" />
            <p>{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
