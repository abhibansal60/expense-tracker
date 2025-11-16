import { Filter, Settings, Sun, Moon } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface HeaderProps {
  filtersActive: boolean;
  onToggleFilters: () => void;
  onOpenSettings: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function Header({ filtersActive, onToggleFilters, onOpenSettings, theme, onToggleTheme }: HeaderProps) {
  const user = useQuery(api.users.getCurrentUser);
  const displayName = user?.name || 'Demo User';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((name) => name.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  return (
    <header className="mobile-hero" data-section="home">
      <div className="hero-status">
        <span className="status-dot" aria-hidden="true" />
        <span>Guest workspace synced</span>
      </div>

      <div className="hero-heading">
        <div>
          <p className="hero-eyebrow">Welcome back</p>
          <h1>Expense Tracker</h1>
          <p className="hero-tagline">Capture spending anywhere with an app-like experience.</p>
        </div>
        <div className="avatar-chip" aria-label={`Signed in as ${displayName}`}>
          {initials || 'ET'}
        </div>
      </div>

      <div className="hero-actions">
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
