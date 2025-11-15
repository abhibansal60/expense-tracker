import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ExpenseForm } from './ExpenseForm';
import { ExpenseList } from './ExpenseList';
import { MonthlySummary } from './MonthlySummary';

export function ExpenseTracker() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  return (
    <div className="space-y-6">
      {/* Monthly Summary */}
      <MonthlySummary month={selectedMonth} />
      
      {/* Add Expense Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Recent Expenses</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Expense</span>
        </button>
      </div>
      
      {/* Add Expense Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <ExpenseForm 
              onSuccess={() => setShowAddForm(false)}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        </div>
      )}
      
      {/* Expense List */}
      <ExpenseList />
    </div>
  );
}