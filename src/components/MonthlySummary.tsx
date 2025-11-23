import { type ReactNode, useMemo, useState } from 'react';
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
  const monthlyTrends = useQuery(api.expenses.getMonthlyTrends, { limitMonths: 6 });

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
  const hasCategoryData = summary.categoryBreakdown.length > 0 && summary.totalExpenses > 0;
  const hasTrendData = (monthlyTrends?.length ?? 0) > 0;
  const hasAccountData = summary.accountBreakdown.length > 0;
  const showCharts = hasCategoryData || hasTrendData || hasAccountData;

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
          {hasCategoryData && (
            <div className="chart-card">
              <p className="eyebrow">Spending mix</p>
              <h3 className="chart-title">Categories this month</h3>
              <CategoryPieChart data={summary.categoryBreakdown} total={summary.totalExpenses} />
            </div>
          )}
          {hasTrendData && (
            <div className="chart-card">
              <p className="eyebrow">Income vs expenses</p>
              <h3 className="chart-title">Recent months</h3>
              <MonthlyComparisonChart data={monthlyTrends ?? []} />
            </div>
          )}
          {hasAccountData && (
            <div className="chart-card">
              <p className="eyebrow">Accounts</p>
              <h3 className="chart-title">Where money goes</h3>
              <AccountBreakdown data={summary.accountBreakdown} total={summary.totalExpenses} />
            </div>
          )}
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

function CategoryPieChart({
  data,
  total,
}: {
  data: Array<{ categoryId: string; amount: number; count: number; categoryName: string }>;
  total: number;
}) {
  const sortedData = useMemo(() => [...data].sort((a, b) => b.amount - a.amount), [data]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const slices = useMemo(() => {
    let offset = 0;
    return sortedData.map((slice) => {
      const fraction = total > 0 ? slice.amount / total : 0;
      const start = offset;
      offset += fraction;
      return { ...slice, fraction, start };
    });
  }, [sortedData, total]);

  const palette = ['#8b5cf6', '#22c55e', '#f97316', '#06b6d4', '#f43f5e', '#a855f7', '#10b981', '#eab308'];
  const activeSlice = slices.find((slice) => slice.categoryId === activeCategory) ?? slices[0];
  const activePercentage = activeSlice && total > 0 ? (activeSlice.fraction * 100).toFixed(1) : '0.0';

  if (!sortedData.length || total <= 0) {
    return <p className="panel-subtitle">We&apos;ll chart spending once you have category activity.</p>;
  }

  const radius = 42;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="pie-chart">
      <div className="pie-visual" aria-hidden="true">
        <svg viewBox="0 0 120 120" className="pie-ring">
          <circle cx="60" cy="60" r={radius} className="pie-track" />
          {slices.map((slice, index) => {
            const dashArray = `${Math.max(slice.fraction, 0.003) * circumference} ${circumference}`;
            const dashOffset = -slice.start * circumference;
            const isActive = activeSlice?.categoryId === slice.categoryId;

            return (
              <circle
                key={slice.categoryId}
                cx="60"
                cy="60"
                r={radius}
                className={`pie-slice ${isActive ? 'is-active' : ''}`}
                stroke={palette[index % palette.length]}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                onMouseEnter={() => setActiveCategory(slice.categoryId)}
                onFocus={() => setActiveCategory(slice.categoryId)}
                tabIndex={0}
                aria-label={`${slice.categoryName}: ${formatCurrency(slice.amount)} (${(slice.fraction * 100).toFixed(1)}%)`}
              />
            );
          })}
        </svg>
        <div className="pie-center">
          <span>Spent</span>
          <strong>{formatCurrency(total)}</strong>
        </div>
      </div>

      <div className="pie-legend" role="list">
        {slices.map((slice, index) => {
          const percentage = total > 0 ? (slice.amount / total) * 100 : 0;
          const isActive = activeSlice?.categoryId === slice.categoryId;

          return (
            <button
              type="button"
              key={slice.categoryId}
              className={`pie-legend__item ${isActive ? 'is-active' : ''}`}
              onMouseEnter={() => setActiveCategory(slice.categoryId)}
              onFocus={() => setActiveCategory(slice.categoryId)}
              onBlur={() => setActiveCategory(null)}
            >
              <span className="legend-swatch" style={{ background: palette[index % palette.length] }} aria-hidden="true" />
              <div className="pie-legend__text">
                <p>{slice.categoryName}</p>
                <span>
                  {percentage.toFixed(1)}% · {formatCurrency(slice.amount)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {activeSlice && (
        <div className="pie-detail">
          <div>
            <p className="pie-detail__label">{activeSlice.categoryName}</p>
            <p className="pie-detail__value">{formatCurrency(activeSlice.amount)}</p>
          </div>
          <p className="pie-detail__meta">
            {activePercentage}% of spending · {activeSlice.count} item{activeSlice.count === 1 ? '' : 's'}
          </p>
        </div>
      )}
    </div>
  );
}

function MonthlyComparisonChart({
  data,
}: {
  data: Array<{ month: string; income: number; expense: number; net: number }>;
}) {
  const [hoveredIndex, setHoveredIndex] = useState(Math.max(data.length - 1, 0));

  if (!data.length) {
    return <p className="panel-subtitle">Add data across months to see the trend.</p>;
  }

  const resolvedIndex = Math.min(Math.max(hoveredIndex, 0), data.length - 1);
  const activePoint = data[resolvedIndex];
  const maxValue = Math.max(...data.map((point) => Math.max(point.income, point.expense)), 1);

  const chartHeight = 140;
  const groupWidth = 48;
  const gap = 14;
  const barWidth = 12;
  const chartWidth = data.length * (groupWidth + gap) - gap;

  const formatMonth = (month: string) =>
    new Date(`${month}-01`).toLocaleDateString('en-GB', { month: 'short' });

  const formatMonthLong = (month: string) =>
    new Date(`${month}-01`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <div className="bar-chart">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 24}`} role="img" aria-label="Monthly income versus expenses">
        {data.map((point, index) => {
          const incomeHeight = (point.income / maxValue) * chartHeight;
          const expenseHeight = (point.expense / maxValue) * chartHeight;
          const groupX = index * (groupWidth + gap);

          return (
            <g
              key={point.month}
              className={`bar-group ${resolvedIndex === index ? 'is-active' : ''}`}
              transform={`translate(${groupX}, 0)`}
              onMouseEnter={() => setHoveredIndex(index)}
              onFocus={() => setHoveredIndex(index)}
              tabIndex={0}
              aria-label={`${formatMonthLong(point.month)}: Income ${formatCurrency(point.income)}, expenses ${formatCurrency(point.expense)}`}
            >
              <rect
                className="bar bar-expense"
                x={6}
                y={chartHeight - expenseHeight}
                width={barWidth}
                height={expenseHeight}
                rx={4}
              />
              <rect
                className="bar bar-income"
                x={6 + barWidth + 6}
                y={chartHeight - incomeHeight}
                width={barWidth}
                height={incomeHeight}
                rx={4}
              />
              <text x={groupWidth / 2} y={chartHeight + 16} textAnchor="middle" className="bar-label">
                {formatMonth(point.month)}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="chart-legend">
        <span className="legend-pill legend-pill--expense">Expenses</span>
        <span className="legend-pill legend-pill--income">Income</span>
      </div>

      <div className="bar-detail">
        <div>
          <p className="pie-detail__label">{formatMonthLong(activePoint.month)}</p>
          <p className={`pie-detail__value ${activePoint.net >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(Math.abs(activePoint.net))}
          </p>
        </div>
        <p className="pie-detail__meta">
          Income {formatCurrency(activePoint.income)} · Expenses {formatCurrency(activePoint.expense)}
        </p>
      </div>
    </div>
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
