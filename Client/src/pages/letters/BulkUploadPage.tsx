/**
 * Port of the PHP app's pages/letters/bulk.php. POST /letters/bulk
 * (API_DOCUMENTATION.md) takes a plain JSON array of letter objects, not
 * a file, so CSV upload here is purely client-side sugar: parseCsvRows/
 * rowsFromCsv turn an uploaded .csv into the same DraftRow[] the manual
 * "add a row" form produces, so both paths feed the identical editable
 * table and submit handler below. Uploading replaces the current rows
 * rather than appending, since re-uploading a corrected file is the
 * expected fix-up flow.
 *
 * Like LetterCreatePage, Admins need an explicit directorate picker
 * (their directorateId is null - they have no home directorate) while
 * ODU users register against their own directorate automatically. One
 * picker applies to the whole batch rather than per-row, since a bulk
 * upload is realistically "all these letters are from directorate X".
 */
import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useToast } from '../../components/ui/Toast/useToast';
import { createLettersBulk } from '../../services/letterService';
import { fetchDirectorates } from '../../services/directorateService';
import { extractErrorMessage } from '../../services/apiClient';
import type { BulkCreateLetterRequest, LetterPriority } from '../../types/api';

interface DraftRow {
  key: number;
  recipientName: string;
  recipientAddress: string;
  subject: string;
  priority: LetterPriority;
  liabilityValue: string;
}

function emptyRow(key: number): DraftRow {
  return { key, recipientName: '', recipientAddress: '', subject: '', priority: 'Medium', liabilityValue: '0' };
}

const CSV_TEMPLATE_HEADERS = ['Recipient Name', 'Recipient Address', 'Subject', 'Priority', 'Liability Value'];
const CSV_TEMPLATE_EXAMPLE_ROW = ['Adebayo Ogundimu', '15 Awolowo Road, Ikeja, Lagos State', 'Tax Assessment Notice', 'Medium', '0'];

// Directorate is deliberately not a column - it's picked once for the
// whole batch above the table (see needsDirectoratePicker), not per row.
function csvField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function downloadCsvTemplate() {
  const csv = [CSV_TEMPLATE_HEADERS, CSV_TEMPLATE_EXAMPLE_ROW].map((row) => row.map(csvField).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'bulk-upload-template.csv';
  link.click();
  URL.revokeObjectURL(url);
}

type DraftField = Exclude<keyof DraftRow, 'key'>;

// Matches the CSV_TEMPLATE_HEADERS labels (case-insensitively), plus a
// couple of forgiving aliases, so a template downloaded via
// downloadCsvTemplate() round-trips through a spreadsheet editor and
// still parses on the way back in.
const CSV_HEADER_ALIASES: Record<string, DraftField> = {
  'recipient name': 'recipientName',
  'recipient address': 'recipientAddress',
  subject: 'subject',
  priority: 'priority',
  'liability value': 'liabilityValue',
  liability: 'liabilityValue',
};

// Minimal RFC 4180 reader: handles quoted fields, escaped `""`
// quotes-within-quotes, and both \n and \r\n line endings - the
// inverse of csvField()'s escaping above.
function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const BOM = String.fromCharCode(0xfeff);
  const input = text.startsWith(BOM) ? text.slice(BOM.length) : text;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\r') {
      // skip - the \n right after it closes the row below
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

const VALID_PRIORITIES: LetterPriority[] = ['Low', 'Medium', 'High'];

function rowsFromCsv(text: string, startKey: number): { rows: DraftRow[]; skipped: number } {
  const parsed = parseCsvRows(text);
  if (parsed.length === 0) return { rows: [], skipped: 0 };

  const columnIndex: Partial<Record<DraftField, number>> = {};
  parsed[0].forEach((header, index) => {
    const field = CSV_HEADER_ALIASES[header.trim().toLowerCase()];
    if (field) columnIndex[field] = index;
  });

  function cell(cols: string[], field: DraftField): string {
    const index = columnIndex[field];
    return index === undefined ? '' : (cols[index] ?? '').trim();
  }

  let key = startKey;
  let skipped = 0;
  const rows: DraftRow[] = [];
  for (const cols of parsed.slice(1)) {
    const recipientName = cell(cols, 'recipientName');
    const recipientAddress = cell(cols, 'recipientAddress');
    const subject = cell(cols, 'subject');
    if (!recipientName || !recipientAddress || !subject) {
      skipped++;
      continue;
    }
    const rawPriority = cell(cols, 'priority') as LetterPriority;
    const rawLiability = cell(cols, 'liabilityValue');
    rows.push({
      key: key++,
      recipientName,
      recipientAddress,
      subject,
      priority: VALID_PRIORITIES.includes(rawPriority) ? rawPriority : 'Medium',
      liabilityValue: rawLiability && !Number.isNaN(Number(rawLiability)) ? rawLiability : '0',
    });
  }

  return { rows, skipped };
}

export function BulkUploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [rows, setRows] = useState<DraftRow[]>([emptyRow(0)]);
  const [nextKey, setNextKey] = useState(1);
  const [directorateId, setDirectorateId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const needsDirectoratePicker = user?.role === 'Admin' || user?.role === 'Management';
  const { data: directorates } = useAsyncData(
    () => (needsDirectoratePicker ? fetchDirectorates() : Promise.resolve([])),
    [needsDirectoratePicker]
  );

  function updateRow(key: number, patch: Partial<DraftRow>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((current) => [...current, emptyRow(nextKey)]);
    setNextKey((k) => k + 1);
  }

  function removeRow(key: number) {
    setRows((current) => (current.length > 1 ? current.filter((row) => row.key !== key) : current));
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ''; // reset so choosing the same file again still fires onChange
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const { rows: parsedRows, skipped } = rowsFromCsv(String(reader.result ?? ''), nextKey);
      if (parsedRows.length === 0) {
        showToast('error', 'No valid rows found in that CSV - check it has Recipient Name, Recipient Address, and Subject columns.');
        return;
      }
      setRows(parsedRows);
      setNextKey(nextKey + parsedRows.length);
      const skippedNote = skipped > 0 ? ` ${skipped} row(s) skipped (missing a required field).` : '';
      showToast('success', `Loaded ${parsedRows.length} row(s) from ${file.name}.${skippedNote}`);
    };
    reader.onerror = () => showToast('error', `Could not read ${file.name}.`);
    reader.readAsText(file);
  }

  function isRowIncomplete(row: DraftRow): boolean {
    return !row.recipientName.trim() || !row.recipientAddress.trim() || !row.subject.trim();
  }

  const validRows = rows.filter((row) => !isRowIncomplete(row));
  const hasInvalidRows = validRows.length !== rows.length;
  const resolvedDirectorateId = needsDirectoratePicker ? directorateId : user?.directorateId;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!resolvedDirectorateId || validRows.length === 0) {
      if (needsDirectoratePicker && !directorateId) showToast('warning', 'Choose a directorate first.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: BulkCreateLetterRequest[] = validRows.map((row) => ({
        sender_directorate_id: Number(resolvedDirectorateId),
        recipient_name: row.recipientName,
        recipient_address: row.recipientAddress,
        subject: row.subject,
        priority: row.priority,
        liability_value: Number(row.liabilityValue) || 0,
      }));
      const result = await createLettersBulk(payload);
      const count = (result as { count?: number })?.count ?? payload.length;
      showToast('success', `${count} letter(s) created successfully.`);
      navigate('/letters');
    } catch (err) {
      showToast('error', extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell pageTitle="Bulk Upload">
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Bulk Upload</h1>
            <p>Register multiple letters at once - add a row for each one.</p>
          </div>
          <div className="flex-row gap-sm">
            <Button type="button" variant="secondary" onClick={downloadCsvTemplate}>
              <i className="fas fa-file-csv" /> Download CSV Template
            </Button>
            <Button type="button" variant="primary" onClick={handleUploadClick}>
              <i className="fas fa-upload" /> Upload CSV
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileSelected}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {needsDirectoratePicker && (
          <Card>
            <CardBody>
              <div className="form-group" style={{ maxWidth: 320, marginBottom: 0 }}>
                <label htmlFor="bulk-directorate">
                  Directorate <span className="required">*</span>
                </label>
                <select id="bulk-directorate" value={directorateId} onChange={(e) => setDirectorateId(e.target.value)}>
                  <option value="">Choose a directorate…</option>
                  {(directorates ?? []).map((dir) => (
                    <option key={dir.id} value={dir.id}>
                      {dir.name} ({dir.code})
                    </option>
                  ))}
                </select>
                <p className="secondary-text mt-sm">Applies to every row below.</p>
              </div>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader
            title={
              <>
                {rows.length} Row(s)
                {hasInvalidRows && <span className="text-danger"> · {rows.length - validRows.length} incomplete</span>}
              </>
            }
            action={<Button variant="secondary" size="sm" onClick={addRow}>+ Add Row</Button>}
          />
          <CardBody>
            <form onSubmit={handleSubmit}>
              <div className="bulk-upload-hint">
                <i className="fas fa-circle-info" aria-hidden="true" />
                <span>Fill in rows below, or use Upload CSV above to load them from a file. Fields marked * are required.</span>
              </div>

              <div className="table-responsive">
                <table className="data-table bulk-upload-table">
                  {/* Mixing px and % column widths under table-layout: fixed
                      can push the total past 100% and force horizontal
                      overflow - so every column here is a percentage,
                      summing to exactly 100. */}
                  <colgroup>
                    <col style={{ width: '4%' }} />
                    <col style={{ width: '19%' }} />
                    <col style={{ width: '24%' }} />
                    <col style={{ width: '19%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '6%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="row-index">#</th>
                      <th className="required-col">Recipient Name</th>
                      <th className="required-col">Recipient Address</th>
                      <th className="required-col">Subject</th>
                      <th>Priority</th>
                      <th>Liability</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={row.key} className={isRowIncomplete(row) ? 'row-incomplete' : undefined}>
                        <td className="row-index">
                          {isRowIncomplete(row) ? (
                            <i className="fas fa-triangle-exclamation" title="Missing a required field" />
                          ) : (
                            index + 1
                          )}
                        </td>
                        <td>
                          <input
                            className="bulk-row-input"
                            value={row.recipientName}
                            onChange={(e) => updateRow(row.key, { recipientName: e.target.value })}
                            placeholder="Full name"
                          />
                        </td>
                        <td>
                          <input
                            className="bulk-row-input"
                            value={row.recipientAddress}
                            onChange={(e) => updateRow(row.key, { recipientAddress: e.target.value })}
                            placeholder="Street address"
                          />
                        </td>
                        <td>
                          <input
                            className="bulk-row-input"
                            value={row.subject}
                            onChange={(e) => updateRow(row.key, { subject: e.target.value })}
                            placeholder="Letter subject"
                          />
                        </td>
                        <td>
                          <select
                            className="bulk-row-select"
                            value={row.priority}
                            onChange={(e) => updateRow(row.key, { priority: e.target.value as LetterPriority })}
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>
                        </td>
                        <td>
                          <div className="bulk-liability-cell">
                            <span className="bulk-currency-symbol" aria-hidden="true">₦</span>
                            <input
                              className="bulk-row-input"
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.liabilityValue}
                              onChange={(e) => updateRow(row.key, { liabilityValue: e.target.value })}
                            />
                          </div>
                        </td>
                        <td className="action-cell">
                          <button
                            type="button"
                            className="btn-ghost bulk-remove-btn"
                            aria-label="Remove row"
                            onClick={() => removeRow(row.key)}
                            disabled={rows.length === 1}
                          >
                            <i className="fas fa-trash" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {hasInvalidRows && (
                <p className="secondary-text mt-md">
                  Rows missing a recipient name, address, or subject will be skipped on submit.
                </p>
              )}

              <div className="form-actions">
                <Button type="button" variant="secondary" onClick={() => navigate('/letters')}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={validRows.length === 0}>
                  <i className="fas fa-upload" /> Submit {validRows.length} Letter(s)
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
