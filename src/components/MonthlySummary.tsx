import { type ReactNode } from 'react';
import { useQuery } from 'convex/react';
import { TrendingUp, TrendingDown, Wallet, PieChart } from 'lucide-react';
import { api } from '../../convex/_generated/api';

const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatCurrency = (value: number) => currencyFormatter.format(value);

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
  const hasTrendData = summary.dailySeries.some((point) => point.expense > 0 || point.income > 0);
  const hasAccountData = summary.accountBreakdown.length > 0;
  const showCharts = hasTrendData || hasAccountData;

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
            <p className="summary-value positive">{formatCurrency(summary.totalIncome)}</p>
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
            <p className="summary-value negative">{formatCurrency(summary.totalExpenses)}</p>
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
              {formatCurrency(Math.abs(summary.netAmount))}
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

      {showCharts && (
        <div className="chart-grid">
          <div className="chart-card">
            <p className="eyebrow">Daily cashflow</p>
            <h3 className="chart-title">Income vs spend</h3>
            <TrendChart data={summary.dailySeries} />
            <div className="chart-legend">
              <span className="legend-pill legend-pill--expense">Expenses</span>
              <span className="legend-pill legend-pill--income">Income</span>
            </div>
          </div>
          <div className="chart-card">
            <p className="eyebrow">Accounts</p>
            <h3 className="chart-title">Where money goes</h3>
            <AccountBreakdown data={summary.accountBreakdown} total={summary.totalExpenses} />
          </div>
        </div>
      )}

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
                        {formatCurrency(category.amount)}{' '}
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

function TrendChart({ data }: { data: Array<{ income: number; expense: number; dayLabel: string }> }) {
  const hasValues = data.some((point) => point.expense > 0 || point.income > 0);
  if (!hasValues) {
    return <p className="panel-subtitle">No daily activity this month yet.</p>;
  }

  const chartWidth = 320;
  const chartHeight = 120;
  const maxValue = Math.max(...data.map((point) => Math.max(point.expense, point.income)), 1);
  const step = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;

  const getPoint = (value: number) => chartHeight - (value / maxValue) * chartHeight;
  const buildLine = (key: 'income' | 'expense') =>
    data
      .map((point, index) => {
        const x = index * step;
        const y = getPoint(point[key]);
        return `${index === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');

  const expenseLine = buildLine('expense');
  const expenseArea = `${expenseLine} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;
  const incomeLine = buildLine('income');

  return (
    <svg className="sparkline" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" role="img">
      <path d={expenseArea} className="sparkline-area" />
      <path d={expenseLine} className="sparkline-path expense" />
      <path d={incomeLine} className="sparkline-path income" />
    </svg>
  );
}

function AccountBreakdown({
  data,
  total,
}: {
  data: Array<{ account: string; amount: number }>;
  total: number;
}) {
  if (!data.length) {
    return <p className="panel-subtitle">We&apos;ll chart accounts once you record expenses.</p>;
  }

  const sorted = [...data].sort((a, b) => b.amount - a.amount).slice(0, 4);

  return (
    <div className="account-chart">
      {sorted.map((slice) => {
        const percentage = total ? (slice.amount / total) * 100 : 0;
        return (
          <div key={slice.account} className="account-row">
            <div>
              <p>{slice.account}</p>
              <span>{formatCurrency(slice.amount)}</span>
            </div>
            <div className="account-meter">
              <div style={{ width: `${Math.min(percentage, 100)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
