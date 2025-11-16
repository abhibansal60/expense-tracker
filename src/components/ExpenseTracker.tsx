import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useQuery } from 'convex/react';
import { Plus } from 'lucide-react';
import { ExpenseForm } from './ExpenseForm';
import { ExpenseList } from './ExpenseList';
import { MonthlySummary } from './MonthlySummary';
import { DataBridgePanel } from './DataBridgePanel';
import { api } from '../../convex/_generated/api';

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export type ExpenseTrackerPreferences = {
  compactMode: boolean;
};

interface ExpenseTrackerProps {
  showFilters: boolean;
  onToggleFilters: () => void;
  preferences: ExpenseTrackerPreferences;
}

export function ExpenseTracker({
  showFilters,
  onToggleFilters,
  preferences,
}: ExpenseTrackerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const availableMonths = useQuery(api.expenses.getAvailableMonths) ?? [];

  useEffect(() => {
    if (!selectedMonth && availableMonths.length > 0) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  const fallbackMonth = useMemo(() => getCurrentMonth(), []);
  const monthOptions = availableMonths.length > 0 ? availableMonths : [fallbackMonth];
  const activeMonth = monthOptions.includes(selectedMonth) ? selectedMonth : monthOptions[0];
  const currentIndex = monthOptions.findIndex((value) => value === activeMonth);

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

  const handleMonthSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(event.target.value);
  };

  const monthActions = (
    <div className="month-controls">
      <button
        type="button"
        className="btn-soft"
        onClick={goToOlderMonth}
        disabled={currentIndex === monthOptions.length - 1}
      >
        Previous
      </button>
      <select value={activeMonth} onChange={handleMonthSelect} className="month-select input-field">
        {monthOptions.map((month) => (
          <option key={month} value={month}>
            {formatMonthLabel(month)}
          </option>
        ))}
      </select>
      <button type="button" className="btn-soft" onClick={goToNewerMonth} disabled={currentIndex <= 0}>
        Next
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <MonthlySummary month={activeMonth} actions={monthActions} />

      <div className="dashboard-grid">
        <div className="space-y-6">
          <section className="card">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="eyebrow">Manual entry</p>
                <h2 className="panel-title">Add a quick expense</h2>
                <p className="panel-subtitle">Capture ad-hoc purchases and credits in seconds.</p>
              </div>
              <button onClick={() => setShowAddForm(true)} className="btn-primary">
                <Plus className="h-4 w-4" />
                <span>Add expense</span>
              </button>
            </div>
          </section>

          <ExpenseList
            showFilters={showFilters}
            onShowFiltersChange={(value) => {
              if (value !== showFilters) {
                onToggleFilters();
              }
            }}
            compactMode={preferences.compactMode}
          />
        </div>

        <div className="space-y-6">
          <DataBridgePanel />
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <ExpenseForm onSuccess={() => setShowAddForm(false)} onCancel={() => setShowAddForm(false)} />
          </div>
        </div>
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
