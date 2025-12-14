import { NAV_ITEMS } from './navigationConfig';
import type { TrackerView } from './ExpenseTracker';

interface NavbarProps {
    active: TrackerView;
    onNavigate: (target: TrackerView) => void;
}

export function Navbar({ active, onNavigate }: NavbarProps) {
    return (
        <nav className="desktop-nav" aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.id;
                return (
                    <button
                        key={item.id}
                        type="button"
                        className={`desktop-nav__item ${isActive ? 'desktop-nav__item--active' : ''}`}
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
