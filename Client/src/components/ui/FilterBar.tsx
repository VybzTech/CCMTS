/**
 * Wraps styles/app.css's .filter-card / .filter-form / .filter-field
 * pattern (the same one retrofitted onto the PHP app's pending-approvals
 * filters during the design cleanup - see .filter-field in app.css).
 * Compose it with plain <select>/<input> elements wrapped in
 * FilterField; FilterBar itself only owns the card chrome, form
 * submit handling, and the optional trailing results-count slot.
 *
 *   <FilterBar onSubmit={handleFilter} resultsLabel={`${total} letter(s) found`}>
 *     <FilterField label="Directorate:">
 *       <select ...>...</select>
 *     </FilterField>
 *   </FilterBar>
 */
import type { FormEvent, ReactNode } from 'react';
import { Card } from './Card';

interface FilterBarProps {
  children: ReactNode;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  resultsLabel?: ReactNode;
}

export function FilterBar({ children, onSubmit, resultsLabel }: FilterBarProps) {
  return (
    <Card className="filter-card">
      <form
        className="filter-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit?.(event);
        }}
      >
        <div className="flex-row gap-md">
          {children}
          {resultsLabel && <span className="secondary-text ml-auto">{resultsLabel}</span>}
        </div>
      </form>
    </Card>
  );
}

export function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="filter-field">
      <label>{label}</label>
      {children}
    </div>
  );
}
