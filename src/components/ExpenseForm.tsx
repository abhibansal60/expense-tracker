import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { X, Save } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useHouseholdUser } from './HouseholdUserGate';
import type { Id } from '../../convex/_generated/dataModel';

interface ExpenseFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const EXPENSE_ACCOUNTS = ['Card', 'Bank', 'Cash'] as const;
const INCOME_ACCOUNTS = ['HSBC', 'Monzo'] as const;

type ExpenseAccountOption = (typeof EXPENSE_ACCOUNTS)[number];
type IncomeAccountOption = (typeof INCOME_ACCOUNTS)[number];
type AccountOption = ExpenseAccountOption | IncomeAccountOption;
type IncomeOwner = 'Abhinav' | 'Kanika';
const INCOME_OWNERS: IncomeOwner[] = ['Abhinav', 'Kanika'];

type ExpenseFormState = {
  amount: string;
  description: string;
  category: '' | Id<'categories'>;
  account: AccountOption;
  incomeOwner: IncomeOwner;
  date: string;
  type: 'income' | 'expense';
};

const INCOME_CATEGORY_NAMES: Record<IncomeOwner, string> = {
  Abhinav: 'Income - Abhinav',
  Kanika: 'Income - Kanika',
};

const getDefaultAccountForType = (type: ExpenseFormState['type']) =>
  type === 'income' ? INCOME_ACCOUNTS[0] : EXPENSE_ACCOUNTS[0];

export function ExpenseForm({ onSuccess, onCancel }: ExpenseFormProps) {
  const { user } = useHouseholdUser();
  const [formData, setFormData] = useState<ExpenseFormState>({
    amount: '',
    description: '',
    category: '',
    account: getDefaultAccountForType('expense'),
    incomeOwner: user.name as IncomeOwner,
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      incomeOwner: user.name as IncomeOwner,
    }));
  }, [user.name]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Fetch categories for dropdown
  const categories = useQuery(api.categories.getCategories) ?? [];
  const addExpense = useMutation(api.expenses.addExpense);
  const createCategory = useMutation(api.categories.createCategory);
  const isIncome = formData.type === 'income';
  const accountOptions = isIncome ? INCOME_ACCOUNTS : EXPENSE_ACCOUNTS;
  const ensureIncomeCategory = async (owner: IncomeOwner) => {
    const categoryName = INCOME_CATEGORY_NAMES[owner];
    const existing = categories.find((category) => category.name === categoryName);
    if (existing) {
      return existing._id;
    }

    return await createCategory({
      name: categoryName,
      isDefault: false,
      memberId: user.id,
    });
  };

  const ensureFallbackCategory = async () => {
    const otherCategory = categories.find((category) => category.name === 'Other');
    if (otherCategory) {
      return otherCategory._id;
    }

    return await createCategory({
      name: 'Other',
      emoji: '\u2713',
      isDefault: true,
      memberId: user.id,
    });
  };

  const handleTypeChange = (type: ExpenseFormState['type']) => {
    setFormData((prev) => ({
      ...prev,
      type,
      account: getDefaultAccountForType(type),
      category: type === 'expense' ? prev.category : '',
    }));
    setValidationError(null);
  };
  
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

      let categoryId: Id<'categories'> | null = null;

      if (formData.type === 'income') {
        categoryId = await ensureIncomeCategory(formData.incomeOwner);
      } else {
        categoryId = formData.category || null;

        if (!categoryId) {
          categoryId = await ensureFallbackCategory();
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
        memberId: user.id,
      });

      setFormData((prev) => ({
        ...prev,
        amount: '',
        description: '',
        category: '',
        account: getDefaultAccountForType(prev.type),
        date: new Date().toISOString().split('T')[0],
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

    if (name === 'account') {
      setFormData((prev) => ({ ...prev, account: value as AccountOption }));
      return;
    }

    if (name === 'incomeOwner') {
      setFormData((prev) => ({ ...prev, incomeOwner: value as IncomeOwner }));
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
            onClick={() => handleTypeChange('expense')}
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
            onClick={() => handleTypeChange('income')}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
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
        
        {formData.type === 'expense' ? (
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
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Income recipient
            </label>
            <select
              name="incomeOwner"
              value={formData.incomeOwner}
              onChange={handleInputChange}
              className="input-field"
            >
              {INCOME_OWNERS.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Account */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isIncome ? 'Deposit account' : 'Payment account'}
          </label>
          <select
            name="account"
            value={formData.account}
            onChange={handleInputChange}
            className="input-field"
          >
            {accountOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
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
