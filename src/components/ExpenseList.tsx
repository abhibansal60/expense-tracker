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
  manual: { label: 'Manual', className: 'source-badge source-badge--manual' },
  monzo: { label: 'Monzo CSV', className: 'source-badge source-badge--monzo' },
  import: { label: 'CSV import', className: 'source-badge source-badge--import' },
};

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
    const formatted = `£${amount.toFixed(2)}`;
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="eyebrow">Recent activity</p>
          <h3 className="panel-title">Expense timeline ({expenses.length})</h3>
        </div>
        <button className="btn-soft" onClick={() => onShowFiltersChange(!showFilters)}>
          <Filter className="h-4 w-4" />
          {showFilters ? 'Hide filters' : 'Filters'}
        </button>
      </div>

      {showFilters && (
        <div className="filter-panel mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                className="input-field text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button onClick={resetFilters} className="btn-secondary text-sm">
              Reset Filters
            </button>
          </div>
        </div>
      )}

      <div className={`space-y-0 max-h-96 overflow-y-auto ${compactMode ? 'compact-list' : ''}`}>
        {expenses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No expenses found</p>
            <p className="text-sm">Add your first expense to get started</p>
          </div>
        ) : (
          expenses.map((expense) => {
            const sourceMeta = getSourceMeta(expense.source as 'manual' | 'monzo' | 'import');
            return (
              <div key={expense._id} className="expense-item">
                <div className="flex items-start gap-4">
                  {renderTypeIcon(expense.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 truncate">{expense.description}</p>
                        <div className="expense-meta mt-1">
                          <span>
                            {expense.categoryDetails?.emoji} {expense.categoryDetails?.name}
                          </span>
                          <span>{expense.account}</span>
                          <span>{formatDate(expense.date)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-bold ${
                            expense.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {formatAmount(expense.amount, expense.type)}
                        </p>
                        <div className="expense-meta justify-end">
                          <span>by {expense.userDetails?.name?.split(' ')[0] || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="expense-meta mt-2">
                      <span className={sourceMeta.className}>{sourceMeta.label}</span>
                      {expense.merchant && <span>{expense.merchant}</span>}
                    </div>
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
