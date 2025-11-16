import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Filter, Calendar, TrendingDown, TrendingUp } from 'lucide-react';

type ExpenseFilters = {
  category: '' | Id<'categories'>;
  type: '' | 'income' | 'expense';
  startDate: string;
  endDate: string;
};

const SOURCE_LABELS: Record<'manual' | 'monzo' | 'import', { label: string; className: string }> = {
  manual: { label: 'Manual', className: 'source-chip' },
  monzo: { label: 'Monzo CSV', className: 'source-chip source-chip--accent' },
  import: { label: 'Data bridge', className: 'source-chip source-chip--alt' },
};
const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

interface ExpenseListProps {
  showFilters: boolean;
  onShowFiltersChange: (value: boolean) => void;
  compactMode?: boolean;
}

export function ExpenseList({ showFilters, onShowFiltersChange, compactMode }: ExpenseListProps) {
  const [filters, setFilters] = useState<ExpenseFilters>({
    category: '',
    type: '',
    startDate: '',
    endDate: '',
  });

  const expenses =
    useQuery(api.expenses.getExpenses, {
      limit: 50,
      category: filters.category || undefined,
      type: filters.type || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    }) ?? [];

  const categories = useQuery(api.categories.getCategories) ?? [];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number, type: 'income' | 'expense') => {
    const formatted = currencyFormatter.format(amount);
    return type === 'income' ? `+${formatted}` : `-${formatted}`;
  };

  const resetFilters = () => {
    setFilters({
      category: '',
      type: '',
      startDate: '',
      endDate: '',
    });
  };

  const renderTypeIcon = (type: 'income' | 'expense') => {
    const icon =
      type === 'income' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;

    return (
      <div className={`expense-indicator ${type === 'income' ? 'income' : 'expense'}`}>
        {icon}
      </div>
    );
  };

  const getSourceMeta = (source?: 'manual' | 'monzo' | 'import') => {
    if (!source) return SOURCE_LABELS.manual;
    return SOURCE_LABELS[source];
  };

  return (
    <div className="card list-card">
      <div className="list-header">
        <div>
          <p className="eyebrow">Recent activity</p>
          <h3 className="panel-title">Timeline</h3>
          <p className="list-count">{expenses.length} latest entries</p>
        </div>
        <button className="btn-soft" onClick={() => onShowFiltersChange(!showFilters)}>
          <Filter className="h-4 w-4" />
          {showFilters ? 'Hide filters' : 'Filters'}
        </button>
      </div>

      {showFilters && (
        <div className="filter-sheet">
          <div className="filter-grid">
            <label>
              <span>Category</span>
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    category: e.target.value ? (e.target.value as Id<'categories'>) : '',
                  }))
                }
                className="input-field text-sm"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.emoji ? `${category.emoji} ` : ''}
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Type</span>
              <select
                value={filters.type}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    type: e.target.value as ExpenseFilters['type'],
                  }))
                }
                className="input-field text-sm"
              >
                <option value="">All types</option>
                <option value="expense">Expenses</option>
                <option value="income">Income</option>
              </select>
            </label>

            <label>
              <span>From date</span>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                className="input-field text-sm"
              />
            </label>

            <label>
              <span>To date</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                className="input-field text-sm"
              />
            </label>
          </div>
          <button onClick={resetFilters} className="btn-secondary filter-reset">
            Reset filters
          </button>
        </div>
      )}

      <div className={`expense-feed ${compactMode ? 'expense-feed--compact' : ''}`}>
        {expenses.length === 0 ? (
          <div className="empty-feed">
            <Calendar className="h-10 w-10" />
            <p>No expenses found</p>
            <p className="text-sm text-gray-500">Add your first expense to see it here.</p>
          </div>
        ) : (
          expenses.map((expense) => {
            const sourceMeta = getSourceMeta(expense.source as 'manual' | 'monzo' | 'import');
            return (
              <div key={expense._id} className="expense-item">
                {renderTypeIcon(expense.type)}
                <div className="expense-content">
                  <div className="expense-row">
                    <p className="expense-title">{expense.description}</p>
                    <p className={`expense-amount ${expense.type === 'income' ? 'income' : 'expense'}`}>
                      {formatAmount(expense.amount, expense.type)}
                    </p>
                  </div>
                  <div className="expense-meta">
                    <span>
                      {expense.categoryDetails?.emoji} {expense.categoryDetails?.name}
                    </span>
                    <span>{expense.account}</span>
                    <span>{formatDate(expense.date)}</span>
                  </div>
                  <div className="expense-meta">
                    <span className={sourceMeta.className}>{sourceMeta.label}</span>
                    <span>by {expense.userDetails?.name?.split(' ')[0] || 'Unknown'}</span>
                    {expense.merchant && <span>{expense.merchant}</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
