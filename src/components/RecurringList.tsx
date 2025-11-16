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
  const { user } = useHouseholdUser();
  const entries = useQuery(api.recurring.listRecurringEntries);
  const deleteEntry = useMutation(api.recurring.deleteRecurringEntry);

  if (!entries) {
    return (
      <section className="card recurring-card" aria-busy="true">
        <div className="recurring-skeleton">
          {[1, 2, 3].map((item) => (
            <div key={item} className="recurring-skeleton-row" />
          ))}
        </div>
      </section>
    );
  }

  const handleDelete = async (id: Id<'recurringEntries'>) => {
    try {
      await deleteEntry({ id, memberId: user.id });
    } catch (error) {
      console.error('Unable to delete recurring entry', error);
    }
  };

  return (
    <section className="card recurring-card">
      <div className="recurring-header">
        <div>
          <p className="eyebrow">Recurring entries</p>
          <h2 className="panel-title">Subscriptions & salaries</h2>
          <p className="panel-subtitle">Automatically posted on their charge day.</p>
        </div>
        <RefreshCw className="h-5 w-5 text-slate-400" aria-hidden="true" />
      </div>

      {entries.length === 0 ? (
        <div className="empty-recurring">
          <p>You don&apos;t have any recurring entries yet.</p>
          <p className="panel-subtitle">Add items like rent, utilities or payroll and we&apos;ll handle the rest.</p>
        </div>
      ) : (
        <ul className="recurring-list" aria-live="polite">
          {entries.map((entry) => (
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
