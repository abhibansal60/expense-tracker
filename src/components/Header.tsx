import { Filter, Settings, Sun, Moon, UploadCloud, ListChecks, PieChart } from 'lucide-react';
import { useHouseholdUser } from './HouseholdUserGate';
import type { TrackerView } from './ExpenseTracker';

interface HeaderProps {
  filtersActive: boolean;
  onToggleFilters: () => void;
  onOpenSettings: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  activeView: TrackerView;
  onChangeView: (view: TrackerView) => void;
}

export function Header({
  filtersActive,
  onToggleFilters,
  onOpenSettings,
  theme,
  onToggleTheme,
  activeView,
  onChangeView,
}: HeaderProps) {
  const { user } = useHouseholdUser();
  const displayName = user.name;
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((name) => name.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  const navItems: Array<{ id: TrackerView; label: string; helper: string; icon?: typeof PieChart }> = [
    { id: 'overview', label: 'Overview', helper: 'Insights', icon: PieChart },
    { id: 'activity', label: 'Activity', helper: 'Manual + timeline', icon: ListChecks },
    { id: 'import', label: 'Bridge', helper: 'CSV workflows', icon: UploadCloud },
  ];

  return (
    <header className="app-navbar" data-section="home">
      <div className="app-navbar__brand" aria-label={`Signed in as ${displayName}`}>
        <div className="app-navbar__avatar">{initials || 'ET'}</div>
        <div>
          <p className="app-navbar__eyebrow">Working as {displayName}</p>
          <div className="app-navbar__title">Expense Tracker</div>
        </div>
      </div>

      <div className="app-navbar__tabs" role="tablist" aria-label="Expense tracker views">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`app-navbar__tab ${isActive ? 'app-navbar__tab--active' : ''}`}
              onClick={() => onChangeView(item.id)}
              role="tab"
              aria-selected={isActive}
            >
              {Icon ? <Icon size={18} aria-hidden="true" /> : null}
              <div className="app-navbar__tab-text">
                <span>{item.label}</span>
                <small>{item.helper}</small>
              </div>
            </button>
          );
        })}
      </div>

      <div className="app-navbar__actions">
        <button
          className={`pill-button ${filtersActive ? 'pill-button--active' : ''}`}
          onClick={onToggleFilters}
        >
          <Filter size={18} />
          Filters
        </button>
        <button className="pill-button" onClick={onOpenSettings}>
          <Settings size={18} />
          Settings
        </button>
        <button className="pill-button icon-only" onClick={onToggleTheme} title="Toggle theme">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>
    </header>
  );
}
