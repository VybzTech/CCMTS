/**
 * Management Reporting - closes UAT MGT-003, MGT-004 and MGT-005, which
 * failed together because the Management role had no reportable view at
 * all:
 *
 *   MGT-003  no date filter, and no way to reset one
 *   MGT-004  no date column, so range behaviour couldn't be validated
 *   MGT-005  no export, so on-screen data couldn't be reconciled
 *
 * Deliberately built on the existing GET /letters response rather than a
 * new reporting endpoint: the API has no aggregate/report route, and the
 * UAT asks only that the export match the filtered on-screen data, which
 * is far easier to guarantee when both render from one array in memory.
 * If letter volume ever outgrows LARGE_PAGE_SIZE this needs a real
 * server-side report query - see the note on that constant.
 */
import { useMemo, useState } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useToast } from '../../components/ui/Toast/useToast';
import { fetchLetters } from '../../services/letterService';
import { EMPTY_LETTERS } from '../../utils/letterStats';
import { formatCurrency } from '../../utils/format';
import type { Letter } from '../../types/api';

/** The list endpoint is paginated; reporting needs the whole window at
 *  once. 1000 matches ManagementAnalyticsPage. Past that, both pages
 *  silently report on a subset - move to a server-side report query
 *  rather than raising this further. */
const LARGE_PAGE_SIZE = 1000;

/** yyyy-mm-dd in LOCAL time. toISOString() would shift the date across
 *  midnight for anyone east of UTC (Lagos is UTC+1), which is exactly
 *  the off-by-one MGT-004 asks us to make testable. */
function toDateInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfDay(value: string): number {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
}

function endOfDay(value: string): number {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
}

/** RFC 4180: double the quotes, wrap anything containing a comma, quote
 *  or newline. Subjects and addresses routinely contain commas. */
function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const CSV_COLUMNS: { header: string; value: (letter: Letter) => unknown }[] = [
  { header: 'Tracking ID', value: (l) => l.trackingId },
  { header: 'Date Registered', value: (l) => new Date(l.createdAt).toLocaleDateString('en-GB') },
  { header: 'Directorate', value: (l) => l.senderDirectorate?.name ?? '' },
  { header: 'Recipient', value: (l) => l.recipientName },
  { header: 'Subject', value: (l) => l.subject },
  { header: 'LGA', value: (l) => l.lgaAddress },
  { header: 'Priority', value: (l) => l.priority },
  { header: 'Status', value: (l) => l.status.replace(/_/g, ' ') },
  { header: 'Courier', value: (l) => l.courier?.name ?? '' },
  { header: 'Liability Value', value: (l) => l.liabilityValue },
  {
    header: 'Delivered At',
    value: (l) => (l.deliveredAt ? new Date(l.deliveredAt).toLocaleString('en-GB') : ''),
  },
];

export function ManagementReportingPage() {
  const { showToast } = useToast();
  const { data, isLoading, error } = useAsyncData(() => fetchLetters({ limit: LARGE_PAGE_SIZE }), []);
  const letters = data?.letters ?? EMPTY_LETTERS;

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [status, setStatus] = useState('');

  const isFiltered = fromDate !== '' || toDate !== '' || status !== '';

  /** MGT-004 explicitly tests same-day, ordered and REVERSED ranges. A
   *  reversed range (from > to) is treated as user error and surfaced as
   *  a warning rather than silently returning an empty table. */
  const isReversedRange = fromDate !== '' && toDate !== '' && startOfDay(fromDate) > endOfDay(toDate);

  const filtered = useMemo(() => {
    if (isReversedRange) return [];
    return letters.filter((letter) => {
      const registered = new Date(letter.createdAt).getTime();
      if (fromDate && registered < startOfDay(fromDate)) return false;
      if (toDate && registered > endOfDay(toDate)) return false;
      if (status && letter.status !== status) return false;
      return true;
    });
  }, [letters, fromDate, toDate, status, isReversedRange]);

  const totalLiability = useMemo(
    () => filtered.reduce((sum, l) => sum + Number(l.liabilityValue || 0), 0),
    [filtered]
  );

  function resetFilters() {
    setFromDate('');
    setToDate('');
    setStatus('');
  }

  /** MGT-005: the export must match the filtered on-screen data, so it
   *  serialises `filtered` - never the unfiltered source. */
  function exportCsv() {
    if (filtered.length === 0) {
      showToast('warning', 'Nothing to export - no rows match the current filter.');
      return;
    }
    const rows = [
      CSV_COLUMNS.map((c) => csvCell(c.header)).join(','),
      ...filtered.map((letter) => CSV_COLUMNS.map((c) => csvCell(c.value(letter))).join(',')),
    ];
    // Leading BOM so Excel opens this as UTF-8 - without it the Naira
    // sign and accented recipient names render as mojibake on Windows.
    const blob = new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ccms-report-${toDateInputValue(new Date())}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('success', `Exported ${filtered.length} row${filtered.length === 1 ? '' : 's'}.`);
  }

  return (
    <AppShell pageTitle="Reporting">
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Reporting</h1>
            <p>Filter correspondence by date and status, then export exactly what you see.</p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={exportCsv}
            disabled={isLoading || !!error}
          >
            <i className="fas fa-file-csv" aria-hidden="true" /> Export CSV
          </button>
        </div>

        {error && (
          <div className="alert alert-danger">
            <i className="fas fa-circle-exclamation" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {!error && (
          <Card>
            <CardHeader title="Filters" />
            <CardBody>
              <div className="report-filters">
                <div className="form-group">
                  <label htmlFor="report-from">From date</label>
                  <input
                    id="report-from"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="report-to">To date</label>
                  <input
                    id="report-to"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="report-status">Status</label>
                  <select
                    id="report-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="">All statuses</option>
                    <option value="Pending_Approval">Pending Approval</option>
                    <option value="Approved">Approved</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In_Transit">In Transit</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Undelivered">Undelivered</option>
                  </select>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetFilters}
                  disabled={!isFiltered}
                >
                  <i className="fas fa-rotate-left" aria-hidden="true" /> Reset
                </button>
              </div>

              {isReversedRange && (
                <div className="alert alert-warning report-range-warning">
                  <i className="fas fa-triangle-exclamation" aria-hidden="true" />
                  <span>
                    The &quot;From&quot; date is after the &quot;To&quot; date, so no rows can match.
                    Swap them or reset the filter.
                  </span>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {!isLoading && !error && (
          <Card>
            <CardHeader
              title={`Report (${filtered.length} of ${letters.length})`}
              action={
                <span className="report-total">
                  Total liability: <strong>{formatCurrency(String(totalLiability))}</strong>
                </span>
              }
            />
            <CardBody>
              {filtered.length === 0 ? (
                <EmptyState
                  icon="fa-file-circle-question"
                  title="No rows match this filter"
                  description={
                    isFiltered
                      ? 'Try widening the date range or clearing the status filter.'
                      : 'No correspondence has been registered yet.'
                  }
                />
              ) : (
                <DataTable
                  rows={filtered}
                  keyExtractor={(row) => row.id}
                  columns={[
                    { key: 'trackingId', header: 'Tracking ID', render: (row) => row.trackingId },
                    {
                      key: 'createdAt',
                      header: 'Date Registered',
                      render: (row) => new Date(row.createdAt).toLocaleDateString('en-GB'),
                    },
                    {
                      key: 'directorate',
                      header: 'Directorate',
                      render: (row) => row.senderDirectorate?.name ?? '-',
                    },
                    { key: 'recipientName', header: 'Recipient', render: (row) => row.recipientName },
                    {
                      key: 'priority',
                      header: 'Priority',
                      render: (row) => <PriorityBadge priority={row.priority} />,
                    },
                    {
                      key: 'status',
                      header: 'Status',
                      render: (row) => <StatusBadge status={row.status} />,
                    },
                    { key: 'courier', header: 'Courier', render: (row) => row.courier?.name ?? '-' },
                    {
                      key: 'liabilityValue',
                      header: 'Liability',
                      render: (row) => formatCurrency(row.liabilityValue),
                    },
                  ]}
                />
              )}
            </CardBody>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
