import { useState, type ChangeEvent, type FormEvent } from 'react';
import { X, Save } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

interface ExpenseFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

type ExpenseFormState = {
  amount: string;
  description: string;
  category: '' | Id<'categories'>;
  account: 'Card' | 'Bank' | 'Cash';
  date: string;
  type: 'income' | 'expense';
};

export function ExpenseForm({ onSuccess, onCancel }: ExpenseFormProps) {
  const [formData, setFormData] = useState<ExpenseFormState>({
    amount: '',
    description: '',
    category: '',
    account: 'Card',
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Fetch categories for dropdown
  const categories = useQuery(api.categories.getCategories) ?? [];
  const addExpense = useMutation(api.expenses.addExpense);
  const createCategory = useMutation(api.categories.createCategory);
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setValidationError(null);

    try {
      const amountValue = Number(formData.amount);
      if (!Number.isFinite(amountValue) || amountValue <= 0) {
        setValidationError('Enter an amount greater than 0.');
        return;
      }

      const trimmedDescription = formData.description.trim();
      if (!trimmedDescription) {
        setValidationError('Description is required.');
        return;
      }

      let categoryId: Id<'categories'> | null = formData.category || null;

      // If no category selected, create a default "Other" category
      if (!categoryId) {
        const otherCategory = categories.find(c => c.name === 'Other');
        if (otherCategory) {
          categoryId = otherCategory._id;
        } else {
          categoryId = await createCategory({
            name: 'Other',
            emoji: '❓',
            isDefault: true,
          });
        }
      }

      if (!categoryId) {
        setValidationError('Unable to determine a category. Please try again.');
        return;
      }

      await addExpense({
        amount: amountValue,
        description: trimmedDescription,
        category: categoryId,
        account: formData.account,
        date: formData.date,
        type: formData.type,
        source: 'manual',
      });

      setFormData((prev) => ({
        ...prev,
        amount: '',
        description: '',
        category: '',
        account: 'Card',
        date: new Date().toISOString().split('T')[0],
        type: prev.type,
      }));
      onSuccess();
    } catch (error) {
      console.error('Failed to add expense:', error);
      alert('Failed to add expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'category') {
      setFormData(prev => ({ ...prev, category: value as Id<'categories'> | '' }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Add {formData.type === 'expense' ? 'Expense' : 'Income'}
        </h3>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {validationError && (
          <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg" role="alert">
            {validationError}
          </div>
        )}

        {/* Type Toggle */}
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              formData.type === 'expense'
                ? 'bg-red-100 text-red-700 border border-red-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, type: 'income' }))}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              formData.type === 'income'
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Income
          </button>
        </div>
        
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (£)
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            placeholder="0.00"
            step="0.01"
            min="0"
            required
            className="input-field"
          />
        </div>
        
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="What was this for?"
            required
            className="input-field"
          />
        </div>
        
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="input-field"
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.emoji ? `${category.emoji} ` : ''}{category.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Account */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account
          </label>
          <select
            name="account"
            value={formData.account}
            onChange={handleInputChange}
            className="input-field"
          >
            <option value="Card">Card</option>
            <option value="Bank">Bank</option>
            <option value="Cash">Cash</option>
          </select>
        </div>
        
        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            required
            className="input-field"
          />
        </div>
        
        {/* Submit Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex-1 flex items-center justify-center space-x-2"
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
