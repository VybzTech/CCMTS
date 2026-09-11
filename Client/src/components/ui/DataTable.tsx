/**
 * Generic table wrapping styles/app.css's .table-responsive > .data-table.
 * Column-config driven so a new list page (couriers, directorates,
 * letters, ...) defines *what* to show, not how a table is built:
 *
 *   <DataTable
 *     columns={[
 *       { key: 'trackingId', header: 'Tracking ID', render: (l) => l.trackingId },
 *       { key: 'status', header: 'Status', render: (l) => <StatusBadge status={l.status} /> },
 *     ]}
 *     rows={letters}
 *     keyExtractor={(l) => l.id}
 *     emptyState={<EmptyState icon="fa-envelope-open" title="No letters yet" />}
 *   />
 */
import type { ReactNode } from 'react';

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  /** Passed straight to the <td>'s className, e.g. "action-cell" for
   *  the narrow trailing actions column the PHP app used. */
  cellClassName?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  keyExtractor: (row: T) => string | number;
  emptyState?: ReactNode;
  /** Applied to the <tr> - used for the PHP app's .row-urgent highlight
   *  on overdue/high-priority rows. */
  rowClassName?: (row: T) => string | undefined;
}

export function DataTable<T>({
  columns,
  rows,
  keyExtractor,
  emptyState,
  rowClassName,
}: DataTableProps<T>) {
  if (rows.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={keyExtractor(row)} className={rowClassName?.(row)}>
              {columns.map((column) => (
                <td key={column.key} className={column.cellClassName}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
