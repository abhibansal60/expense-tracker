import { ListChecks, PieChart, UploadCloud } from 'lucide-react';
import type { TrackerView } from './ExpenseTracker';

export interface NavItem {
    id: TrackerView;
    label: string;
    icon: typeof PieChart;
}

export const NAV_ITEMS: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: PieChart },
    { id: 'activity', label: 'Activity', icon: ListChecks },
    { id: 'import', label: 'Bridge', icon: UploadCloud },
];
