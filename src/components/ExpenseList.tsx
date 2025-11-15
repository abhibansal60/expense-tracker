import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Filter, Calendar, TrendingDown, TrendingUp } from 'lucide-react';

export function ExpenseList() {
  const [filters, setFilters] = useState({
    category: '',
    type: '' as '' | 'income' | 'expense',
    startDate: '',
    endDate: '',
  });
  
  const [showFilters, setShowFilters] = useState(false);
  
  // Fetch expenses with current filters
  const expenses = useQuery(api.expenses.getExpenses, {
    limit: 50,
    category: filters.category ? filters.category as any : undefined,
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

  const getTypeIcon = (type: 'income' | 'expense') => {
    return type === 'income' ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  return (
    <div className="card">
      {/* Header with Filters */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Expenses ({expenses.length})
        </h3>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-lg transition-colors ${
            showFilters || Object.values(filters).some(Boolean)
              ? 'bg-primary-100 text-primary-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Filter className="h-5 w-5" />
        </button>
      </div>
      
      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="input-field text-sm"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.emoji ? `${category.emoji} ` : ''}{category.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                className="input-field text-sm"
              >
                <option value="">All types</option>
                <option value="expense">Expenses</option>
                <option value="income">Income</option>
              </select>
            </div>
            
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="input-field text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="input-field text-sm"
              />
            </div>
          </div>
          
          {/* Filter Actions */}
          <div className="flex justify-end mt-4">
            <button
              onClick={resetFilters}
              className="btn-secondary text-sm"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
      
      {/* Expense List */}
      <div className="space-y-0 max-h-96 overflow-y-auto">
        {expenses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No expenses found</p>
            <p className="text-sm">Add your first expense to get started</p>
          </div>
        ) : (
          expenses.map((expense) => (
            <div key={expense._id} className="expense-item">
              <div className="flex items-center space-x-4">
                {/* Type Icon */}
                <div className="flex-shrink-0">
                  {getTypeIcon(expense.type)}
                </div>
                
                {/* Expense Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {expense.description}
                    </p>
                    <p className={`text-sm font-semibold ${
                      expense.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatAmount(expense.amount, expense.type)}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>
                        {expense.categoryDetails?.emoji} {expense.categoryDetails?.name}
                      </span>
                      <span>•</span>
                      <span>{expense.account}</span>
                      <span>•</span>
                      <span>{formatDate(expense.date)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-400">
                        by {expense.userDetails?.name?.split(' ')[0] || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}