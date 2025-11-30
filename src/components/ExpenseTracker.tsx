import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { ExpenseForm } from './ExpenseForm';
import { ExpenseList } from './ExpenseList';
import { MonthlySummary } from './MonthlySummary';
import { DataBridgePanel } from './DataBridgePanel';
import { api } from '../../convex/_generated/api';
import { RecurringForm } from './RecurringForm';
import { RecurringList } from './RecurringList';
import { useHouseholdUser } from './HouseholdUserGate';
import { createDefaultFilters, type ExpenseFilters } from './expenseFilters';
import type { Id } from '../../convex/_generated/dataModel';

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getMonthDateRange = (month: string) => {
  const [yearString, monthString] = month.split('-');
  const year = Number(yearString);
  const monthIndex = Number(monthString) - 1;

  const startDate = new Date(year, monthIndex, 1);
  const endDate = new Date(year, monthIndex + 1, 0);

  const formatDate = (date: Date) =>
    [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
};

export type ExpenseTrackerPreferences = {
  compactMode: boolean;
};

export type TrackerView = 'overview' | 'activity' | 'import';

interface ExpenseTrackerProps {
  showFilters: boolean;
  onToggleFilters: () => void;
  preferences: ExpenseTrackerPreferences;
  activeView: TrackerView;
  onChangeView: (view: TrackerView) => void;
}

export function ExpenseTracker({
  showFilters,
  onToggleFilters,
  preferences,
  activeView,
  onChangeView,
}: ExpenseTrackerProps) {
  const [activeSheet, setActiveSheet] = useState<'expense' | 'recurring' | null>(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [activityFilters, setActivityFilters] = useState<ExpenseFilters>(() => createDefaultFilters());
  const availableMonths = useQuery(api.expenses.getAvailableMonths) ?? [];
  const { user } = useHouseholdUser();
  const processRecurring = useMutation(api.recurring.processRecurringEntries);

  const fallbackMonth = useMemo(() => getCurrentMonth(), []);
  const monthOptions = useMemo(() => {
    if (availableMonths.length === 0) {
      return [fallbackMonth];
    }

    return [...availableMonths].sort(
      (a, b) => new Date(`${b}-01`).getTime() - new Date(`${a}-01`).getTime()
    );
  }, [availableMonths, fallbackMonth]);

  useEffect(() => {
    if (!monthOptions.includes(selectedMonth)) {
      setSelectedMonth(monthOptions[0]);
    }
  }, [monthOptions, selectedMonth]);

  const activeMonth = monthOptions.includes(selectedMonth) ? selectedMonth : monthOptions[0];
  const currentIndex = monthOptions.findIndex((value) => value === activeMonth);

  useEffect(() => {
    if (!activeMonth) {
      return;
    }
    processRecurring({ month: activeMonth, memberId: user.id }).catch((error) => {
      console.error('Failed to sync recurring entries', error);
    });
  }, [activeMonth, processRecurring, user.id]);

  const goToOlderMonth = () => {
    if (currentIndex < monthOptions.length - 1) {
      setSelectedMonth(monthOptions[currentIndex + 1]);
    }
  };

  const goToNewerMonth = () => {
    if (currentIndex > 0) {
      setSelectedMonth(monthOptions[currentIndex - 1]);
    }
  };

  const handleCategorySelect = ({ categoryId, type }: { categoryId: string; type: 'income' | 'expense' }) => {
    const monthRange = getMonthDateRange(activeMonth);

    setActivityFilters({
      ...createDefaultFilters(),
      ...monthRange,
      category: categoryId as Id<'categories'>,
      type,
    });

    if (activeView !== 'activity') {
      onChangeView('activity');
    }

    if (showFilters) {
      onToggleFilters();
    }
  };

  const handleMonthSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(event.target.value);
  };

  const monthActions = (
    <div className="month-selector">
      <button
        type="button"
        className="pill-button icon-only"
        onClick={goToOlderMonth}
        disabled={currentIndex === monthOptions.length - 1}
        aria-label="Go to older month"
      >
        <ChevronLeft size={18} />
      </button>
      <div className="month-display">
        <span>Active month</span>
        <strong>{formatMonthLabel(activeMonth)}</strong>
        <select value={activeMonth} onChange={handleMonthSelect} className="month-picker" aria-label="Select month">
          {monthOptions.map((month) => (
            <option key={month} value={month}>
              {formatMonthLabel(month)}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        className="pill-button icon-only"
        onClick={goToNewerMonth}
        disabled={currentIndex <= 0}
        aria-label="Go to newer month"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );

  return (
    <div className="screen-stack tracker-stack">
      {activeView === 'overview' && (
        <MonthlySummary month={activeMonth} actions={monthActions} onCategorySelect={handleCategorySelect} />
      )}

      {activeView === 'activity' && (
        <div className="activity-layout">
          <div className="activity-stack">
            <section className="card quick-entry-card">
              <div>
                <p className="eyebrow">Quick entry</p>
                <h2 className="panel-title">Add a manual expense</h2>
                <p className="panel-subtitle">Tap below or use the floating button to launch the form.</p>
              </div>
              <div className="quick-entry-actions">
                <button onClick={() => setActiveSheet('expense')} className="btn-primary">
                  <Plus className="h-4 w-4" />
                  <span>Add expense</span>
                </button>
                <button onClick={() => setActiveSheet('recurring')} className="btn-secondary">
                  Schedule recurring
                </button>
                <button onClick={onToggleFilters} className="btn-secondary">
                  {showFilters ? 'Hide filters' : 'Show filters'}
                </button>
              </div>
            </section>

            <RecurringList />
          </div>

          <ExpenseList
            showFilters={showFilters}
            onShowFiltersChange={(value) => {
              if (value !== showFilters) {
                onToggleFilters();
              }
            }}
            compactMode={preferences.compactMode}
            activeFilters={activityFilters}
            onFiltersChange={setActivityFilters}
          />
        </div>
      )}

      {activeView === 'import' && <DataBridgePanel />}

      {activeSheet && (
        <div className="sheet-overlay" role="dialog" aria-modal="true">
          <div className="sheet-panel">
            {activeSheet === 'expense' ? (
              <ExpenseForm onSuccess={() => setActiveSheet(null)} onCancel={() => setActiveSheet(null)} />
            ) : (
              <RecurringForm onSuccess={() => setActiveSheet(null)} onCancel={() => setActiveSheet(null)} />
            )}
          </div>
        </div>
      )}

      {activeView === 'activity' && (
        <button
          type="button"
          className={`fab ${activeSheet === 'expense' ? 'fab--hidden' : ''}`}
          onClick={() => setActiveSheet('expense')}
          aria-label="Add expense"
        >
          <Plus className="h-5 w-5" />
          <span>New</span>
        </button>
      )}
    </div>
  );
}

function formatMonthLabel(month: string) {
  return new Date(`${month}-01`).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });
}
