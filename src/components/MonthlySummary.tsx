import { type ReactNode } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { TrendingUp, TrendingDown, Wallet, PieChart } from 'lucide-react';

interface MonthlySummaryProps {
  month: string; // Format: "2025-09"
  actions?: ReactNode;
}

export function MonthlySummary({ month, actions }: MonthlySummaryProps) {
  const summary = useQuery(api.expenses.getMonthlySummary, { month });

  if (!summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const monthName = new Date(`${month}-01`).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });
  const hasActivity = summary.totalExpenses > 0 || summary.totalIncome > 0;

  return (
    <section className="card">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <p className="eyebrow">Monthly overview</p>
          <h2 className="panel-title">{monthName}</h2>
          <p className="panel-subtitle">Live totals from every source connected to your workspace.</p>
        </div>
        {actions}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="summary-card">
          <div>
            <p className="text-sm text-gray-600">Total income</p>
            <p className="summary-value text-green-600">£{summary.totalIncome.toFixed(2)}</p>
          </div>
          <div className="summary-icon bg-green-100 text-green-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <p className="summary-meta">
            {summary.incomeCount} transaction{summary.incomeCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="summary-card">
          <div>
            <p className="text-sm text-gray-600">Total expenses</p>
            <p className="summary-value text-red-600">£{summary.totalExpenses.toFixed(2)}</p>
          </div>
          <div className="summary-icon bg-red-100 text-red-600">
            <TrendingDown className="h-6 w-6" />
          </div>
          <p className="summary-meta">
            {summary.expenseCount} transaction{summary.expenseCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="summary-card">
          <div>
            <p className="text-sm text-gray-600">Net position</p>
            <p className={`summary-value ${summary.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              £{Math.abs(summary.netAmount).toFixed(2)}
            </p>
          </div>
          <div
            className={`summary-icon ${
              summary.netAmount >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}
          >
            <Wallet className="h-6 w-6" />
          </div>
          <p className="summary-meta">{summary.netAmount >= 0 ? 'In surplus' : 'In deficit'}</p>
        </div>

        <div className="summary-card">
          <div>
            <p className="text-sm text-gray-600">Active categories</p>
            <p className="summary-value text-primary-600">{summary.categoryBreakdown.length}</p>
          </div>
          <div className="summary-icon bg-primary-100 text-primary-600">
            <PieChart className="h-6 w-6" />
          </div>
          <p className="summary-meta">Spending buckets with activity</p>
        </div>
      </div>

      {summary.categoryBreakdown.length > 0 && (
        <div className="mt-6">
          <p className="eyebrow">Spending by category</p>
          <h4 className="panel-title">Where your money went</h4>
          <div className="space-y-3 mt-4">
            {summary.categoryBreakdown
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 8)
              .map((category) => {
                const percentage = summary.totalExpenses
                  ? (category.amount / summary.totalExpenses) * 100
                  : 0;
                return (
                  <div key={category.categoryId} className="category-row">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{category.categoryName}</span>
                      <div className="text-sm text-gray-600">
                        £{category.amount.toFixed(2)} ({category.count})
                      </div>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                    </div>
                    <span className="text-xs text-gray-500">{percentage.toFixed(1)}% of expenses</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {!hasActivity && (
        <div className="empty-summary">
          <p className="font-semibold text-gray-700">No data for {monthName}</p>
          <p className="text-sm text-gray-500">
            Use the data bridge or add a manual expense to see insights for this month.
          </p>
        </div>
      )}
    </section>
  );
}
