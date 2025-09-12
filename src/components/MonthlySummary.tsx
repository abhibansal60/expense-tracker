import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { TrendingUp, TrendingDown, Wallet, PieChart } from 'lucide-react';

interface MonthlySummaryProps {
  month: string; // Format: "2025-09"
}

export function MonthlySummary({ month }: MonthlySummaryProps) {
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
    year: 'numeric'
  });

  return (
    <div className="space-y-6">
      {/* Monthly Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Income</p>
              <p className="text-2xl font-bold text-green-600">
                £{summary.totalIncome.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {summary.incomeCount} transaction{summary.incomeCount !== 1 ? 's' : ''}
          </p>
        </div>
        
        {/* Total Expenses */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">
                £{summary.totalExpenses.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {summary.expenseCount} transaction{summary.expenseCount !== 1 ? 's' : ''}
          </p>
        </div>
        
        {/* Net Amount */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Amount</p>
              <p className={`text-2xl font-bold ${
                summary.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                £{Math.abs(summary.netAmount).toFixed(2)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${
              summary.netAmount >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <Wallet className={`h-6 w-6 ${
                summary.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
              }`} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {summary.netAmount >= 0 ? 'Surplus' : 'Deficit'} for {monthName}
          </p>
        </div>
        
        {/* Categories */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-primary-600">
                {summary.categoryBreakdown.length}
              </p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <PieChart className="h-6 w-6 text-primary-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Active spending categories
          </p>
        </div>
      </div>
      
      {/* Category Breakdown */}
      {summary.categoryBreakdown.length > 0 && (
        <div className="card">
          <h4 className="font-semibold text-gray-900 mb-4">
            Spending by Category - {monthName}
          </h4>
          <div className="space-y-3">
            {summary.categoryBreakdown
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 8) // Show top 8 categories
              .map((category) => {
                const percentage = (category.amount / summary.totalExpenses) * 100;
                return (
                  <div key={category.categoryId} className="flex items-center space-x-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {category.categoryName}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            £{category.amount.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({category.count})
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">
                          {percentage.toFixed(1)}% of expenses
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
          
          {summary.categoryBreakdown.length > 8 && (
            <div className="mt-4 text-center">
              <button className="text-sm text-primary-600 hover:text-primary-700">
                View all {summary.categoryBreakdown.length} categories
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}