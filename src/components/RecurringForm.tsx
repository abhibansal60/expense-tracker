import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { Save, X } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { useHouseholdUser } from './HouseholdUserGate';

const EXPENSE_ACCOUNTS = ['Card', 'Bank', 'Cash'] as const;
const INCOME_ACCOUNTS = ['HSBC', 'Monzo'] as const;
type AccountOption = (typeof EXPENSE_ACCOUNTS)[number] | (typeof INCOME_ACCOUNTS)[number];
type RecurringType = 'income' | 'expense';
type IncomeOwner = 'Abhinav' | 'Kanika';
const INCOME_OWNERS: IncomeOwner[] = ['Abhinav', 'Kanika'];
const INCOME_CATEGORY_NAMES: Record<IncomeOwner, string> = {
  Abhinav: 'Income - Abhinav',
  Kanika: 'Income - Kanika',
};

interface RecurringFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const monthInputDefault = () => new Date().toISOString().slice(0, 7);

export function RecurringForm({ onSuccess, onCancel }: RecurringFormProps) {
  const { user } = useHouseholdUser();
  const categories = useQuery(api.categories.getCategories) ?? [];
  const createEntry = useMutation(api.recurring.createRecurringEntry);
  const createCategory = useMutation(api.categories.createCategory);

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '' as '' | Id<'categories'>,
    account: EXPENSE_ACCOUNTS[0] as AccountOption,
    type: 'expense' as RecurringType,
    dayOfMonth: 1,
    startMonth: monthInputDefault(),
    endMonth: '',
    incomeOwner: user.name as IncomeOwner,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    if (name === 'category') {
      setFormData((prev) => ({ ...prev, category: value as Id<'categories'> | '' }));
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
    if (name === 'dayOfMonth') {
      setFormData((prev) => ({ ...prev, dayOfMonth: Number(value) || 1 }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (type: RecurringType) => {
    setFormData((prev) => ({
      ...prev,
      type,
      account: type === 'income' ? INCOME_ACCOUNTS[0] : EXPENSE_ACCOUNTS[0],
      category: type === 'income' ? '' : prev.category,
    }));
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setError(null);

    try {
      const amountValue = Number(formData.amount);
      if (!Number.isFinite(amountValue) || amountValue <= 0) {
        setError('Enter an amount greater than 0.');
        return;
      }
      const trimmedDescription = formData.description.trim();
      if (!trimmedDescription) {
        setError('Description is required.');
        return;
      }
      const dayValue = Number(formData.dayOfMonth);
      if (!Number.isFinite(dayValue) || dayValue < 1 || dayValue > 31) {
        setError('Choose a day between 1 and 31.');
        return;
      }
      if (!/^\d{4}-\d{2}$/.test(formData.startMonth)) {
        setError('Provide a valid start month (YYYY-MM).');
        return;
      }

      let categoryId: Id<'categories'> | null = null;
      if (isIncome) {
        categoryId = await ensureIncomeCategory(formData.incomeOwner);
      } else if (formData.category) {
        categoryId = formData.category;
      } else {
        categoryId = await ensureFallbackCategory();
      }

      if (!categoryId) {
        setError('Select a category.');
        return;
      }

      await createEntry({
        amount: amountValue,
        description: trimmedDescription,
        category: categoryId,
        account: formData.account,
        type: formData.type,
        dayOfMonth: dayValue,
        startMonth: formData.startMonth,
        endMonth: formData.endMonth || undefined,
        memberId: user.id,
      });

      onSuccess();
    } catch (err) {
      console.error(err);
      setError('Unable to save recurring entry. Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">New recurring entry</h3>
        <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg" role="alert">
            {error}
          </div>
        )}

        <div className="flex space-x-2">
          <button
            type="button"
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              formData.type === 'expense' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-600'
            }`}
            onClick={() => handleTypeChange('expense')}
          >
            Expense
          </button>
          <button
            type="button"
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              formData.type === 'income' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600'
            }`}
            onClick={() => handleTypeChange('income')}
          >
            Income
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Amount</label>
          <input
            className="input-field"
            type="number"
            name="amount"
            min="0"
            step="0.01"
            value={formData.amount}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <input
            className="input-field"
            type="text"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
          />
        </div>

        {isIncome ? (
          <div>
            <label className="block text-sm font-medium mb-1">Income recipient</label>
            <select className="input-field" name="incomeOwner" value={formData.incomeOwner} onChange={handleInputChange}>
              {INCOME_OWNERS.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select className="input-field" name="category" value={formData.category} onChange={handleInputChange}>
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.emoji ? `${category.emoji} ` : ''}
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">{isIncome ? 'Deposit account' : 'Payment account'}</label>
          <select className="input-field" name="account" value={formData.account} onChange={handleInputChange}>
            {accountOptions.map((account) => (
              <option key={account} value={account}>
                {account}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Charge day</label>
            <input
              className="input-field"
              type="number"
              name="dayOfMonth"
              min="1"
              max="31"
              value={formData.dayOfMonth}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Start month</label>
            <input
              className="input-field"
              type="month"
              name="startMonth"
              value={formData.startMonth}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">End month (optional)</label>
          <input
            className="input-field"
            type="month"
            name="endMonth"
            value={formData.endMonth}
            onChange={handleInputChange}
          />
        </div>

        <div className="flex space-x-3 pt-4">
          <button type="button" className="btn-secondary flex-1" onClick={onCancel} disabled={isSaving}>
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={isSaving}>
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Saving…' : 'Save recurring'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
