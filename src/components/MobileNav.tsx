import { NAV_ITEMS } from './navigationConfig';
import type { TrackerView } from './ExpenseTracker';

interface MobileNavProps {
  active: TrackerView;
  onNavigate: (target: TrackerView) => void;
}

export function MobileNav({ active, onNavigate }: MobileNavProps) {
  return (
    <nav className="mobile-nav md:hidden" aria-label="Primary navigation">
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
            aria-label={`${item.label} view`}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
