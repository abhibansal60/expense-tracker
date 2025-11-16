import { type ReactNode } from 'react';
import { useQuery } from 'convex/react';
import { TrendingUp, TrendingDown, Wallet, PieChart } from 'lucide-react';
import { api } from '../../convex/_generated/api';

const GBP_SYMBOL = '\u00A3';

interface MonthlySummaryProps {
  month: string; // Format: "2025-09"
  actions?: ReactNode;
}

export function MonthlySummary({ month, actions }: MonthlySummaryProps) {
  const summary = useQuery(api.expenses.getMonthlySummary, { month });

  if (!summary) {
    return (
      <section className="card monthly-card" data-section="insights" aria-busy="true">
        <div className="summary-skeleton">
          {[1, 2, 3, 4].map((value) => (
            <div key={value} className="skeleton-card" />
          ))}
        </div>
      </section>
    );
  }

  const monthName = new Date(`${month}-01`).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });
  const hasActivity = summary.totalExpenses > 0 || summary.totalIncome > 0;

  return (
    <section className="card monthly-card" data-section="insights">
      <div className="summary-header">
        <div>
          <p className="eyebrow">Monthly overview</p>
          <h2 className="panel-title">{monthName}</h2>
          <p className="panel-subtitle">Live totals from every connected source.</p>
        </div>
        {actions}
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <div>
            <p>Total income</p>
            <p className="summary-value positive">
              {GBP_SYMBOL}
              {summary.totalIncome.toFixed(2)}
            </p>
            <span className="summary-meta">
              {summary.incomeCount} transaction{summary.incomeCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="summary-icon positive">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        <div className="summary-card">
          <div>
            <p>Total expenses</p>
            <p className="summary-value negative">
              {GBP_SYMBOL}
              {summary.totalExpenses.toFixed(2)}
            </p>
            <span className="summary-meta">
              {summary.expenseCount} transaction{summary.expenseCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="summary-icon negative">
            <TrendingDown className="h-5 w-5" />
          </div>
        </div>

        <div className="summary-card">
          <div>
            <p>Net position</p>
            <p className={`summary-value ${summary.netAmount >= 0 ? 'positive' : 'negative'}`}>
              {GBP_SYMBOL}
              {Math.abs(summary.netAmount).toFixed(2)}
            </p>
            <span className="summary-meta">{summary.netAmount >= 0 ? 'In surplus' : 'In deficit'}</span>
          </div>
          <div className={`summary-icon ${summary.netAmount >= 0 ? 'positive' : 'negative'}`}>
            <Wallet className="h-5 w-5" />
          </div>
        </div>

        <div className="summary-card">
          <div>
            <p>Active categories</p>
            <p className="summary-value accent">{summary.categoryBreakdown.length}</p>
            <span className="summary-meta">Spending buckets</span>
          </div>
          <div className="summary-icon accent">
            <PieChart className="h-5 w-5" />
          </div>
        </div>
      </div>

      {summary.categoryBreakdown.length > 0 && (
        <div className="category-breakdown">
          <p className="eyebrow">Top categories</p>
          <div className="category-list">
            {summary.categoryBreakdown
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 6)
              .map((category) => {
                const percentage = summary.totalExpenses
                  ? (category.amount / summary.totalExpenses) * 100
                  : 0;
                return (
                  <div key={category.categoryId} className="category-row">
                    <div>
                      <p>{category.categoryName}</p>
                      <span>
                        {GBP_SYMBOL}
                        {category.amount.toFixed(2)}{' '}
                        {'\u00B7'} {category.count} item
                        {category.count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="category-meter">
                      <div style={{ width: `${Math.min(percentage, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {!hasActivity && (
        <div className="empty-summary">
          <p>No data for {monthName}</p>
          <p className="panel-subtitle">
            Use the data bridge or add a manual expense to see insights for this month.
          </p>
        </div>
      )}
    </section>
  );
}
