import { useState } from 'react';
import {
  Filter,
  Settings,
  Sun,
  Moon,
  UploadCloud,
  ListChecks,
  PieChart,
  Menu,
  LogOut,
} from 'lucide-react';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, clearUser } = useHouseholdUser();
  const displayName = user.name;
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((name) => name.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  const navItems: Array<{ id: TrackerView; label: string; icon: typeof PieChart }> = [
    { id: 'overview', label: 'Overview', icon: PieChart },
    { id: 'activity', label: 'Activity', icon: ListChecks },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-3 rounded-full border border-border/60 bg-muted/60 px-3 py-2 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground font-semibold shadow-lg ring-2 ring-primary/30">
            {initials || 'ET'}
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Expense tracker</span>
            <span className="text-sm font-semibold text-foreground">{displayName}</span>
          </div>
        </div>

        <div
          className="hidden md:flex items-center gap-1 rounded-full border border-border/60 bg-muted/60 p-1 shadow-sm"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id)}
                className={`
                  group relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ease-out
                  ${isActive
                    ? 'bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 text-primary shadow-[0_10px_30px_-18px_rgba(59,130,246,0.6)] ring-1 ring-primary/25'
                    : 'text-muted-foreground hover:-translate-y-0.5 hover:text-foreground hover:bg-background/60'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <span
                  className={`absolute inset-0 rounded-full border border-transparent transition-colors ${
                    isActive ? 'border-primary/30' : 'border-border/40 group-hover:border-border'
                  }`}
                  aria-hidden
                />
                <Icon
                  size={16}
                  className={`relative transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}
                />
                <span className="relative">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onToggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon size={20} strokeWidth={2} /> : <Sun size={20} strokeWidth={2} />}
            <span className="sr-only">Toggle theme</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`
                inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-primary/20
                ${menuOpen ? 'bg-accent text-accent-foreground' : ''}
              `}
              aria-expanded={menuOpen}
              aria-label="Open user menu"
            >
              <Menu size={20} strokeWidth={2} />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border bg-popover p-1 text-popover-foreground shadow-xl animate-in fade-in-0 zoom-in-95">
                  <div className="px-4 py-3 border-b border-border/50 mb-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Signed in as</p>
                    <p className="text-sm font-semibold truncate text-foreground">{displayName}</p>
                  </div>

                  <div className="flex flex-col gap-1 p-1">
                    <button
                      onClick={() => {
                        onChangeView('import');
                        setMenuOpen(false);
                      }}
                      className={`
                        relative flex w-full cursor-default select-none items-center rounded-lg px-3 py-2.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground
                        ${activeView === 'import' ? 'bg-accent/50 text-accent-foreground' : ''}
                      `}
                    >
                      <UploadCloud size={16} className="mr-3 opacity-70" />
                      Bridge
                    </button>
                    <button
                      onClick={() => {
                        onToggleFilters();
                        setMenuOpen(false);
                      }}
                      className={`
                        relative flex w-full cursor-default select-none items-center rounded-lg px-3 py-2.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground
                        ${filtersActive ? 'bg-accent/50 text-accent-foreground' : ''}
                      `}
                    >
                      <Filter size={16} className="mr-3 opacity-70" />
                      Filters
                    </button>
                    <button
                      onClick={() => {
                        onOpenSettings();
                        setMenuOpen(false);
                      }}
                      className="relative flex w-full cursor-default select-none items-center rounded-lg px-3 py-2.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <Settings size={16} className="mr-3 opacity-70" />
                      Settings
                    </button>
                    <div className="my-1 h-px bg-border/50" />
                    <button
                      onClick={() => {
                        clearUser();
                        setMenuOpen(false);
                      }}
                      className="relative flex w-full cursor-default select-none items-center rounded-lg px-3 py-2.5 text-sm outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive text-muted-foreground"
                    >
                      <LogOut size={16} className="mr-3 opacity-70" />
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
