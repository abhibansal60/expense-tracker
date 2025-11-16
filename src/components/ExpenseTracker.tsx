import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useQuery } from 'convex/react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
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

  const viewTabs: Array<{ id: TrackerView; label: string; helper: string }> = [
    { id: 'overview', label: 'Overview', helper: 'Insights' },
    { id: 'activity', label: 'Activity', helper: 'Manual + timeline' },
    { id: 'import', label: 'Bridge', helper: 'CSV workflows' },
  ];

  return (
    <div className="screen-stack tracker-stack">
      <div className="view-tabs" role="tablist">
        {viewTabs.map((tab) => (
          <button
            key={tab.id}
            className={`view-tabs__item ${activeView === tab.id ? 'view-tabs__item--active' : ''}`}
            type="button"
            onClick={() => onChangeView(tab.id)}
            role="tab"
            aria-selected={activeView === tab.id}
          >
            <span>{tab.label}</span>
            <small>{tab.helper}</small>
          </button>
        ))}
      </div>

      {activeView === 'overview' && <MonthlySummary month={activeMonth} actions={monthActions} />}

      {activeView === 'activity' && (
        <div className="activity-layout">
          <section className="card quick-entry-card">
            <div>
              <p className="eyebrow">Quick entry</p>
              <h2 className="panel-title">Add a manual expense</h2>
              <p className="panel-subtitle">Tap below or use the floating button to launch the form.</p>
            </div>
            <div className="quick-entry-actions">
              <button onClick={() => setShowAddForm(true)} className="btn-primary">
                <Plus className="h-4 w-4" />
                <span>Add expense</span>
              </button>
              <button onClick={onToggleFilters} className="btn-secondary">
                {showFilters ? 'Hide filters' : 'Show filters'}
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
      )}

      {activeView === 'import' && <DataBridgePanel />}

      {showAddForm && (
        <div className="sheet-overlay" role="dialog" aria-modal="true">
          <div className="sheet-panel">
            <ExpenseForm onSuccess={() => setShowAddForm(false)} onCancel={() => setShowAddForm(false)} />
          </div>
        </div>
      )}

      {activeView === 'activity' && (
        <button
          type="button"
          className={`fab ${showAddForm ? 'fab--hidden' : ''}`}
          onClick={() => setShowAddForm(true)}
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
