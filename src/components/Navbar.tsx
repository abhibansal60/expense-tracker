import { PieChart, ListChecks } from 'lucide-react';
import type { TrackerView } from './ExpenseTracker';

const NAV_ITEMS: Array<{ id: TrackerView; label: string; icon: typeof PieChart }> = [
    { id: 'overview', label: 'Overview', icon: PieChart },
    { id: 'activity', label: 'Activity', icon: ListChecks },
];

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
                    >
                        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                        <span>{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}
