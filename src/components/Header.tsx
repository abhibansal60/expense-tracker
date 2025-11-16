import { Wallet, Filter, Settings, Sparkles } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface HeaderProps {
  filtersActive: boolean;
  onToggleFilters: () => void;
  onOpenSettings: () => void;
}

export function Header({ filtersActive, onToggleFilters, onOpenSettings }: HeaderProps) {
  const user = useQuery(api.users.getCurrentUser);
  const displayName = user?.name || 'Demo User';

  return (
    <header className="app-hero">
      <div className="container">
        <div className="hero-panel">
          <div className="hero-top">
            <div className="hero-brand">
              <div className="logo-icon">
                <Wallet size={28} />
              </div>
              <div>
                <p className="eyebrow">Expense command center</p>
                <h1>Expense Tracker</h1>
                <p className="hero-tagline">
                  A modern dashboard for manual entries, CSV imports, and Monzo statements.
                </p>
              </div>
            </div>

            <div className="hero-controls">
              <div className="user-pill">
                <span className="font-semibold">{displayName}</span>
                <span>Guest workspace</span>
              </div>
              <div className="hero-actions">
                <button
                  className={`btn-soft ${filtersActive ? 'btn-active' : ''}`}
                  title="Filter expenses"
                  onClick={onToggleFilters}
                >
                  <Filter size={18} />
                  Filters
                </button>
                <button className="btn-soft" title="Settings" onClick={onOpenSettings}>
                  <Settings size={18} />
                  Settings
                </button>
              </div>
            </div>
          </div>

          <div className="hero-highlights">
            <div className="highlight-card">
              <p className="eyebrow">Connected sources</p>
              <p className="highlight-value">Manual + Monzo CSV</p>
            </div>
            <div className="highlight-card">
              <p className="eyebrow">Workspace status</p>
              <p className="highlight-value">Guest mode active</p>
            </div>
            <div className="highlight-card">
              <p className="eyebrow">Data bridge</p>
              <p className="highlight-value">Ready for import</p>
            </div>
            <div className="highlight-card">
              <p className="eyebrow">Insights</p>
              <p className="highlight-value flex items-center gap-1">
                <Sparkles size={16} /> Live summary
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
