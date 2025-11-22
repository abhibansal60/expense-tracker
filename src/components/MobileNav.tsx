import { PieChart, ListChecks, UploadCloud } from 'lucide-react';
import type { TrackerView } from './ExpenseTracker';

const NAV_ITEMS: Array<{ id: TrackerView; label: string; icon: typeof PieChart }> = [
  { id: 'overview', label: 'Overview', icon: PieChart },
  { id: 'activity', label: 'Activity', icon: ListChecks },
  { id: 'import', label: 'Bridge', icon: UploadCloud },
];

interface MobileNavProps {
  active: TrackerView;
  onNavigate: (target: TrackerView) => void;
}

export function MobileNav({ active, onNavigate }: MobileNavProps) {
  return (
    <nav className="mobile-nav" aria-label="Primary navigation">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={`mobile-nav__item ${isActive ? 'mobile-nav__item--active' : ''}`}
            onClick={() => onNavigate(item.id)}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
