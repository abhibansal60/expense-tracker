import type { Id } from '../../convex/_generated/dataModel';

export type ExpenseFilters = {
  category: '' | Id<'categories'>;
  type: '' | 'income' | 'expense';
  startDate: string;
  endDate: string;
};

export function createDefaultFilters(): ExpenseFilters {
  return {
    category: '',
    type: '',
    startDate: '',
    endDate: '',
  };
}
