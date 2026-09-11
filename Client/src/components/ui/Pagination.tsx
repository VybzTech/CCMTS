/**
 * Wraps styles/app.css's .pagination (a/span items, .active, .disabled
 * modifiers). The PHP app rendered real <a href="?page=N"> links since
 * every page was a full server round-trip; this SPA version calls
 * onPageChange(n) instead since the list itself re-fetches via
 * useEffect - same look, click-driven data fetch instead of navigation.
 *
 * Shows first/last page, the current page +/-1, and "…" for any gap,
 * so it stays compact even with the API's "pages: 8"-style large
 * counts (see GET /letters in API_DOCUMENTATION.md).
 */
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pageNumbers = getVisiblePages(page, totalPages);

  return (
    <nav className="pagination" aria-label="Pagination">
      <PageLink
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        label={<i className="fas fa-chevron-left" aria-hidden="true" />}
        ariaLabel="Previous page"
      />

      {pageNumbers.map((entry, index) =>
        entry === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className="disabled">
            <span>…</span>
          </span>
        ) : (
          <PageLink
            key={entry}
            active={entry === page}
            onClick={() => onPageChange(entry)}
            label={entry}
            ariaLabel={`Page ${entry}`}
          />
        )
      )}

      <PageLink
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        label={<i className="fas fa-chevron-right" aria-hidden="true" />}
        ariaLabel="Next page"
      />
    </nav>
  );
}

interface PageLinkProps {
  label: React.ReactNode;
  ariaLabel: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function PageLink({ label, ariaLabel, active, disabled, onClick }: PageLinkProps) {
  if (disabled) {
    return (
      <span className="disabled">
        <span aria-label={ariaLabel}>{label}</span>
      </span>
    );
  }
  if (active) {
    return (
      <span className="active">
        <span aria-current="page" aria-label={ariaLabel}>
          {label}
        </span>
      </span>
    );
  }
  return (
    <a href="#" aria-label={ariaLabel} onClick={(event) => { event.preventDefault(); onClick(); }}>
      {label}
    </a>
  );
}

type PageEntry = number | 'ellipsis';

function getVisiblePages(current: number, total: number): PageEntry[] {
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);

  const withEllipsis: PageEntry[] = [];
  sorted.forEach((pageNum, index) => {
    if (index > 0 && pageNum - sorted[index - 1] > 1) {
      withEllipsis.push('ellipsis');
    }
    withEllipsis.push(pageNum);
  });
  return withEllipsis;
}
