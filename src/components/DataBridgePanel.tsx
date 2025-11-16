import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useMutation, useQuery } from 'convex/react';
import Papa from 'papaparse';
import { AlertCircle, FileDown, Loader2, Upload } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { useHouseholdUser } from './HouseholdUserGate';

type NormalizedImportEntry = {
  amount: number;
  description: string;
  categoryName: string;
  account: string;
  date: string;
  type: 'income' | 'expense';
  monzoTransactionId?: string;
  merchant?: string;
  originalCategory?: string;
};

type ImportResponse = {
  inserted: number;
  skipped: number;
  failed: number;
  total: number;
  errors: { row: number; reason: string }[];
};

type ParsedCsvResult = {
  source: 'monzo' | 'money_manager';
  entries: NormalizedImportEntry[];
};

const FALLBACK_CATEGORY = 'General';

export function DataBridgePanel() {
  const [importStatus, setImportStatus] = useState<'idle' | 'parsing' | 'uploading' | 'done' | 'error'>('idle');
  const [importSummary, setImportSummary] = useState<ImportResponse | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [activeFileName, setActiveFileName] = useState<string | null>(null);

  const [exportRequested, setExportRequested] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useHouseholdUser();
  const runImport = useMutation(api.expenses.importExpenses);
  const exportDataset = useQuery(api.expenses.exportExpenses, exportRequested ? {} : undefined);

  useEffect(() => {
    if (!exportRequested || exportDataset === undefined) {
      return;
    }

    try {
      if (exportDataset.length === 0) {
        setExportError('No expenses available to export yet.');
        return;
      }

      const csv = Papa.unparse({
        fields: [
          'Date',
          'Description',
          'Amount',
          'Type',
          'Category',
          'Account',
          'Source',
          'Monzo Transaction ID',
          'Merchant',
          'Original Category',
        ],
        data: exportDataset.map((row) => [
          row.date,
          row.description,
          row.amount,
          row.type,
          row.categoryName,
          row.account,
          row.source,
          row.monzoTransactionId ?? '',
          row.merchant ?? '',
          row.originalCategory ?? '',
        ]),
      });

      triggerDownload(csv);
      setExportError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to build export';
      setExportError(message);
    } finally {
      setExportRequested(false);
    }
  }, [exportRequested, exportDataset]);

  const isBusy = importStatus === 'parsing' || importStatus === 'uploading';

  const summaryLines = useMemo(() => {
    if (!importSummary) return [];
    return [
      `${importSummary.inserted} records imported`,
      `${importSummary.skipped} duplicates`,
      `${importSummary.failed} errors`,
    ];
  }, [importSummary]);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setActiveFileName(file.name);
    setImportStatus('parsing');
    setImportSummary(null);
    setImportError(null);

    try {
      const csvText = await file.text();
      const parsed = parseCsv(csvText);
      if (parsed.entries.length === 0) {
        throw new Error('No rows detected in the CSV file.');
      }
      const sanitizedEntries = parsed.entries.map(normalizeImportEntry);

      setImportStatus('uploading');
      const response = (await runImport({
        source: parsed.source,
        entries: sanitizedEntries,
        memberId: user.id,
      })) as ImportResponse;

      setImportSummary(response);
      setImportStatus('done');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to import that file.';
      setImportError(message);
      setImportStatus('error');
    } finally {
      event.target.value = '';
    }
  };

  const handleExport = () => {
    setExportError(null);
    setExportRequested(true);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const statusLabel = {
    idle: 'Waiting for file',
    parsing: 'Parsing CSV',
    uploading: 'Uploading entries',
    done: 'Import complete',
    error: 'Import failed',
  }[importStatus];

  const statusTone =
    importStatus === 'done'
      ? 'success'
      : importStatus === 'error'
        ? 'error'
        : importStatus === 'idle'
          ? 'muted'
          : 'progress';

  return (
    <section className="card data-bridge" data-section="import">
      <div className="bridge-header">
        <div>
          <p className="eyebrow">Data bridge</p>
          <h3 className="panel-title">Import & export</h3>
          <p className="panel-subtitle">Bring in Monzo statements or legacy CSV exports on the go.</p>
        </div>
        <button className="pill-button" onClick={handleExport} disabled={exportRequested}>
          {exportRequested ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Preparing</span>
            </>
          ) : (
            <>
              <FileDown className="h-4 w-4" />
              <span>Export CSV</span>
            </>
          )}
        </button>
      </div>

      <div className="bridge-upload">
        <button type="button" className="upload-tile" onClick={openFilePicker} disabled={isBusy}>
          <Upload className={`upload-icon ${isBusy ? 'animate-pulse' : ''}`} />
          <div>
            <p>{isBusy ? 'Working on your file...' : 'Tap to import a CSV'}</p>
            <span>
              {activeFileName
                ? `Selected: ${activeFileName}`
                : 'Supports Monzo and Money Manager exports'}
            </span>
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="sr-only"
          onChange={handleFileUpload}
          disabled={isBusy}
        />
      </div>

      <div className="bridge-status">
        <span className={`status-chip status-chip--${statusTone}`}>{statusLabel}</span>
        {activeFileName && <span className="status-chip status-chip--muted">{activeFileName}</span>}
        {importSummary && (
          <span className="status-chip status-chip--muted">{summaryLines.join(' | ')}</span>
        )}
      </div>

      {importSummary && (
        <div className="import-summary">
          {summaryLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
      )}

      {importSummary?.errors.length ? (
        <div className="import-errors">
          <p className="text-sm font-medium text-gray-700 mb-1">Rows to review</p>
          <ul className="text-sm text-gray-500 space-y-1">
            {importSummary.errors.slice(0, 3).map((issue) => (
              <li key={`${issue.row}-${issue.reason}`}>
                Row {issue.row}: {issue.reason}
              </li>
            ))}
            {importSummary.errors.length > 3 && (
              <li>+{importSummary.errors.length - 3} more</li>
            )}
          </ul>
        </div>
      ) : null}

      {importError && (
        <div className="import-error">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span>{importError}</span>
        </div>
      )}

      {exportError && (
        <div className="import-error mt-2">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span>{exportError}</span>
        </div>
      )}
    </section>
  );
}

function parseCsv(csvText: string): ParsedCsvResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0]?.message ?? 'CSV parsing failed.');
  }

  const fields =
    (parsed.meta.fields ?? []).map((field: string | undefined) => field?.toLowerCase()) ?? [];
  const rows = (parsed.data as Record<string, string>[])
    .filter((row) => Object.values(row).some(Boolean));

  if (fields.includes('transaction id')) {
    return {
      source: 'monzo',
      entries: transformMonzoRows(rows),
    };
  }

  if (fields.includes('income/expense') || fields.includes('period')) {
    return {
      source: 'money_manager',
      entries: transformLegacyRows(rows),
    };
  }

  throw new Error('Unrecognized CSV structure. Please upload a Monzo or Money Manager export.');
}

function normalizeImportEntry(entry: NormalizedImportEntry): NormalizedImportEntry {
  // Enforce an exact payload shape so stray CSV columns (e.g. a Member ID) never reach Convex
  return {
    amount: entry.amount,
    description: entry.description,
    categoryName: entry.categoryName,
    account: entry.account,
    date: entry.date,
    type: entry.type,
    monzoTransactionId: entry.monzoTransactionId ?? undefined,
    merchant: entry.merchant ?? undefined,
    originalCategory: entry.originalCategory ?? undefined,
  };
}

function transformLegacyRows(rows: Record<string, string>[]): NormalizedImportEntry[] {
  const entries: NormalizedImportEntry[] = [];

  for (const row of rows) {
    const amount = toNumber(row.Amount ?? row.GBP);
    if (amount <= 0) {
      continue;
    }

    const typeValue = row['Income/Expense']?.toLowerCase() ?? '';
    const type: 'income' | 'expense' = typeValue.startsWith('inc') ? 'income' : 'expense';

    const date = toIsoDate(row.Period, { separator: '-' });
    if (!date) {
      continue;
    }

    const description = (row.Description || row.Note || 'Imported entry').trim();
    const categoryName = (row.Subcategory && row.Subcategory.trim()) || row.Category || FALLBACK_CATEGORY;
    const account = row.Accounts || row.Accounts_1 || row.Account || 'Card';

    const originalCategory =
      row.Category && row.Subcategory
        ? `${row.Category} > ${row.Subcategory}`
        : row.Category || undefined;

    if (isInputToMonzoTransfer(account, description)) {
      continue;
    }

    entries.push({
      amount,
      description,
      categoryName,
      account,
      date,
      type,
      originalCategory,
    });
  }

  return entries;
}

function transformMonzoRows(rows: Record<string, string>[]): NormalizedImportEntry[] {
  const entries: NormalizedImportEntry[] = [];

  for (const row of rows) {
    const moneyOut = Math.abs(toNumber(row['Money Out']));
    const moneyIn = Math.abs(toNumber(row['Money In']));
    const amount = moneyIn > 0 ? moneyIn : moneyOut;
    if (amount <= 0) {
      continue;
    }

    const type: 'income' | 'expense' = moneyIn > 0 ? 'income' : 'expense';
    const date = toIsoDate(row.Date, { separator: '/' });
    if (!date) {
      continue;
    }

    const categoryName = row.Category?.trim() || FALLBACK_CATEGORY;
    const description = (row.Description || row.Name || 'Monzo transaction').trim();

    entries.push({
      amount,
      description,
      categoryName,
      account: row.Type ? `Monzo - ${row.Type}` : 'Monzo',
      date,
      type,
      monzoTransactionId: row['Transaction ID'] || undefined,
      merchant: row.Name || undefined,
      originalCategory: row.Category || undefined,
    });
  }

  return entries;
}

function isInputToMonzoTransfer(account: string, description: string) {
  const normalizedAccount = account.toLowerCase();
  const normalizedDescription = description.toLowerCase();

  return (
    normalizedAccount.includes('input account') &&
    normalizedDescription.includes('monzo account') &&
    normalizedDescription.includes('transfer')
  );
}

function toNumber(value?: string) {
  if (!value) return 0;
  const cleaned = value.replace(/[^\d.-]/g, '');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toIsoDate(rawValue?: string, opts?: { separator: '-' | '/' }) {
  if (!rawValue) return null;
  const parts = rawValue.split(opts?.separator ?? '-');
  if (parts.length !== 3) return null;

  const [day, month, year] = parts.map((part) => part.padStart(2, '0'));
  if (year.length !== 4) return null;

  return `${year}-${month}-${day}`;
}

function triggerDownload(csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `expenses-export-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
