import { useState, useMemo, type Dispatch, type SetStateAction } from 'react';
import { usePaginatedQuery, useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Doc, Id } from '../../convex/_generated/dataModel';
import { Filter, Calendar, TrendingDown, TrendingUp, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import { QueryErrorBoundary } from './QueryErrorBoundary';
import { useHouseholdUser } from './HouseholdUserGate';

type ExpenseFilters = {
  category: '' | Id<'categories'>;
  type: '' | 'income' | 'expense';
  startDate: string;
  endDate: string;
};

type ExpenseListItem = Doc<'expenses'> & {
  categoryDetails?: Doc<'categories'> | null;
  userDetails?: { name?: string | null; email?: string | null } | null;
};

interface ExpenseListProps {
  showFilters: boolean;
  onShowFiltersChange: (value: boolean) => void;
  compactMode?: boolean;
}

export function ExpenseList(props: ExpenseListProps) {
  return (
    <QueryErrorBoundary
      resetKeys={[props.showFilters, props.compactMode]}
      fallback={({ resetErrorBoundary }) => <LegacyExpenseList {...props} onRetry={resetErrorBoundary} />}
    >
      <PaginatedExpenseList {...props} />
    </QueryErrorBoundary>
  );
}

function PaginatedExpenseList({ showFilters, onShowFiltersChange, compactMode }: ExpenseListProps) {
  const { filters, setFilters, resetFilters } = useExpenseFilterState();
  const categories = useQuery(api.categories.getCategories) ?? [];
  const { results: expenses, status, loadMore } = usePaginatedQuery(
    api.expenses.getExpenses,
    {
      category: filters.category || undefined,
      type: filters.type || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    },
    { initialNumItems: compactMode ? 15 : 20 }
  );

  const paginationState = useMemo(() => {
    return {
      isLoadingFirstPage: status === 'LoadingFirstPage',
      isLoadingMore: status === 'LoadingMore',
      canLoadMore: status === 'CanLoadMore',
      hasResults: expenses.length > 0,
    };
  }, [status, expenses.length]);

  return (
    <div className="card list-card">
      <ListHeader
        showFilters={showFilters}
        onToggleFilters={onShowFiltersChange}
        title="Timeline"
        helper="Recent activity"
        countLabel={
          paginationState.isLoadingFirstPage ? 'Loading latest entries...' : `${expenses.length} entries loaded`
        }
      />

      {showFilters && (
        <FilterSheet filters={filters} setFilters={setFilters} categories={categories} onReset={resetFilters} />
      )}

      <ExpenseFeed
        expenses={expenses}
        compactMode={compactMode}
        isLoading={paginationState.isLoadingFirstPage}
        loadingTitle="Loading recent activity..."
        loadingDescription="Hang tight while we fetch your entries."
      />

      {paginationState.hasResults && (paginationState.canLoadMore || paginationState.isLoadingMore) && (
        <div className="mt-4 flex justify-center">
          <button
            className="btn-secondary w-full"
            disabled={!paginationState.canLoadMore}
            onClick={() => paginationState.canLoadMore && loadMore(20)}
          >
            {paginationState.isLoadingMore ? 'Loading more...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}

interface LegacyExpenseListProps extends ExpenseListProps {
  onRetry: () => void;
}

function LegacyExpenseList({ showFilters, onShowFiltersChange, compactMode, onRetry }: LegacyExpenseListProps) {
  const { filters, setFilters, resetFilters } = useExpenseFilterState();
  const categories = useQuery(api.categories.getCategories) ?? [];
  const legacyExpenses = useQuery(api.expenses.listRecentExpenses, {
    limit: compactMode ? 25 : 50,
    category: filters.category || undefined,
    type: filters.type || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
  });
  const isLoading = legacyExpenses === undefined;
  const expenses = legacyExpenses ?? [];

  return (
    <div className="card list-card">
      <ListHeader
        showFilters={showFilters}
        onToggleFilters={onShowFiltersChange}
        title="Timeline"
        helper="Recent activity"
        countLabel={isLoading ? 'Loading latest entries...' : `${expenses.length} entries loaded (limited)`}
      />

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <div className="space-y-1">
          <p className="font-semibold">Showing simplified activity view</p>
          <p className="text-amber-900/80">
            The live timeline hit an issue, so we&apos;re falling back to the basic feed. You can keep browsing or retry the
            realtime view below.
          </p>
          <button type="button" className="btn-secondary" onClick={onRetry}>
            Retry live timeline
          </button>
        </div>
      </div>

      {showFilters && (
        <FilterSheet filters={filters} setFilters={setFilters} categories={categories} onReset={resetFilters} />
      )}

      <ExpenseFeed
        expenses={expenses}
        compactMode={compactMode}
        isLoading={isLoading}
        loadingTitle="Loading latest entries..."
        loadingDescription="Fetching the basic list while we recover."
      />
    </div>
  );
}

function useExpenseFilterState() {
  const [filters, setFilters] = useState<ExpenseFilters>(() => createDefaultFilters());
  const resetFilters = () => setFilters(createDefaultFilters());
  return { filters, setFilters, resetFilters };
}

function FilterSheet({
  filters,
  setFilters,
  categories,
  onReset,
}: {
  filters: ExpenseFilters;
  setFilters: Dispatch<SetStateAction<ExpenseFilters>>;
  categories: Array<{ _id: Id<'categories'>; name: string; emoji?: string }>;
  onReset: () => void;
}) {
  return (
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
      <button onClick={onReset} className="btn-secondary filter-reset">
        Reset filters
      </button>
    </div>
  );
}

function ListHeader({
  showFilters,
  onToggleFilters,
  title,
  helper,
  countLabel,
}: {
  showFilters: boolean;
  onToggleFilters: (value: boolean) => void;
  title: string;
  helper: string;
  countLabel: string;
}) {
  return (
    <div className="list-header">
      <div>
        <p className="eyebrow">{helper}</p>
        <h3 className="panel-title">{title}</h3>
        <p className="list-count">{countLabel}</p>
      </div>
      <button className="btn-soft" onClick={() => onToggleFilters(!showFilters)}>
        <Filter className="h-4 w-4" />
        {showFilters ? 'Hide filters' : 'Filters'}
      </button>
    </div>
  );
}

function ExpenseFeed({
  expenses,
  isLoading,
  compactMode,
  loadingTitle = 'Loading recent activity...',
  loadingDescription = 'Hang tight while we fetch your entries.',
  emptyTitle = 'No expenses found',
  emptyDescription = 'Add your first expense to see it here.',
}: {
  expenses: ExpenseListItem[];
  isLoading: boolean;
  compactMode?: boolean;
  loadingTitle?: string;
  loadingDescription?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const { user } = useHouseholdUser();
  const deleteExpense = useMutation(api.expenses.deleteExpense);
  const [deletingId, setDeletingId] = useState<Id<'expenses'> | null>(null);

  const handleDelete = async (expenseId: Id<'expenses'>) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    setDeletingId(expenseId);
    try {
      await deleteExpense({ id: expenseId, memberId: user.id });
    } catch (error) {
      console.error('Failed to delete expense:', error);
      alert('Failed to delete expense. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={`expense-feed ${compactMode ? 'expense-feed--compact' : ''}`}>
      {isLoading ? (
        <div className="empty-feed">
          <Calendar className="h-10 w-10" />
          <p>{loadingTitle}</p>
          <p className="text-sm text-gray-500">{loadingDescription}</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="empty-feed">
          <Calendar className="h-10 w-10" />
          <p>{emptyTitle}</p>
          <p className="text-sm text-gray-500">{emptyDescription}</p>
        </div>
      ) : (
        expenses.map((expense) => {
          const sourceMeta = getSourceMeta(expense.source as 'manual' | 'monzo' | 'import');
          const isDeleting = deletingId === expense._id;

          return (
            <div key={expense._id} className={`expense-item ${isDeleting ? 'expense-item--deleting' : ''}`}>
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
              <div className="expense-actions">
                <button
                  className="expense-action-btn expense-action-btn--delete"
                  onClick={() => handleDelete(expense._id)}
                  disabled={isDeleting}
                  title="Delete expense"
                  aria-label="Delete expense"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function createDefaultFilters(): ExpenseFilters {
  return {
    category: '',
    type: '',
    startDate: '',
    endDate: '',
  };
}

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

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatAmount(amount: number, type: 'income' | 'expense') {
  const formatted = currencyFormatter.format(amount);
  return type === 'income' ? `+${formatted}` : `-${formatted}`;
}

function renderTypeIcon(type: 'income' | 'expense') {
  const icon = type === 'income' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;

  return (
    <div className={`expense-indicator ${type === 'income' ? 'income' : 'expense'}`}>
      {icon}
    </div>
  );
}

function getSourceMeta(source?: 'manual' | 'monzo' | 'import') {
  if (!source) return SOURCE_LABELS.manual;
  return SOURCE_LABELS[source];
}
