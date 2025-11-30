import { useState } from 'react';
import { CalendarClock, RefreshCw, Trash2 } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { useHouseholdUser } from './HouseholdUserGate';

const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function RecurringList() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { user } = useHouseholdUser();
  const entries = useQuery(api.recurring.listRecurringEntries);
  const deleteEntry = useMutation(api.recurring.deleteRecurringEntry);

  const isLoading = entries === undefined;
  const items = entries ?? [];

  const handleDelete = async (id: Id<'recurringEntries'>) => {
    try {
      await deleteEntry({ id, memberId: user.id });
    } catch (error) {
      console.error('Unable to delete recurring entry', error);
    }
  };

  return (
    <section className={`card recurring-card ${isCollapsed ? 'recurring-card--collapsed' : ''}`}>
      <div className="recurring-header">
        <div>
          <p className="eyebrow">Recurring entries</p>
          <h2 className="panel-title">Subscriptions & salaries</h2>
          <p className="panel-subtitle">Automatically posted on their charge day.</p>
        </div>
        <div className="recurring-header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-expanded={!isCollapsed}
            aria-controls="recurring-content"
          >
            {isCollapsed ? 'Show recurring' : 'Hide recurring'}
          </button>
          <RefreshCw className="h-5 w-5 text-slate-400" aria-hidden="true" />
        </div>
      </div>
      <div id="recurring-content">
        {isCollapsed ? (
          <p className="panel-subtitle">Recurring entries are hidden. Expand to manage subscriptions.</p>
        ) : isLoading ? (
          <div className="recurring-skeleton" aria-busy="true">
            {[1, 2, 3].map((item) => (
              <div key={item} className="recurring-skeleton-row" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="empty-recurring">
            <p>You don&apos;t have any recurring entries yet.</p>
            <p className="panel-subtitle">Add items like rent, utilities or payroll and we&apos;ll handle the rest.</p>
          </div>
        ) : (
          <ul className="recurring-list" aria-live="polite">
            {items.map((entry) => (
              <li key={entry._id} className="recurring-row">
                <div>
                  <p className="recurring-title">
                    {entry.description}
                    <span className={`recurring-pill ${entry.type === 'income' ? 'pill-income' : 'pill-expense'}`}>
                      {entry.type}
                    </span>
                  </p>
                  <p className="recurring-meta">
                    {entry.type === 'income' ? 'Deposit to' : 'Charge from'} {entry.account} · {entry.categoryName}
                  </p>
                  <p className="recurring-meta">
                    <CalendarClock className="inline h-4 w-4" aria-hidden="true" /> Next on {formatDate(entry.nextOccurrence)}
                  </p>
                </div>
                <div className="recurring-actions">
                  <strong className={entry.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}>
                    {currencyFormatter.format(entry.amount)}
                  </strong>
                  <button
                    type="button"
                    className="pill-button icon-only"
                    onClick={() => handleDelete(entry._id)}
                    aria-label={`Delete ${entry.description}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('en-GB', { month: 'long', day: 'numeric', year: 'numeric' });
}
