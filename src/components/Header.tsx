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
  X,
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

  const menuItems = [
    {
      id: 'import',
      label: 'Bridge',
      icon: UploadCloud,
      action: () => onChangeView('import'),
      isActive: activeView === 'import',
    },
    {
      id: 'filters',
      label: 'Filters',
      icon: Filter,
      action: onToggleFilters,
      isActive: filtersActive,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      action: onOpenSettings,
      isActive: false,
    },
    {
      id: 'sign-out',
      label: 'Sign out',
      icon: LogOut,
      action: clearUser,
      isActive: false,
      variant: 'destructive' as const,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 md:px-6">
        <div
          className="flex items-center gap-3 rounded-full border border-border/60 bg-muted/70 px-2.5 py-2 shadow-sm"
          aria-label="Expense Tracker"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground font-semibold shadow-lg ring-2 ring-primary/30">
            {initials || 'ET'}
          </div>
          <span className="sr-only">Expense Tracker</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleTheme}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground transition-all hover:border-primary/30 hover:bg-muted/70 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon size={20} strokeWidth={2} /> : <Sun size={20} strokeWidth={2} />}
            <span className="sr-only">Toggle theme</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`
                inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground transition-all hover:border-primary/30 hover:bg-muted/70 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20
                ${menuOpen ? 'border-primary/40 ring-2 ring-primary/20' : ''}
              `}
              aria-expanded={menuOpen}
              aria-label="Open user menu"
            >
              <Menu size={20} strokeWidth={2} />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
                  onClick={() => setMenuOpen(false)}
                />
                <aside className="fixed inset-y-0 right-0 z-50 w-[min(90vw,360px)] translate-x-0 bg-popover text-popover-foreground shadow-2xl ring-1 ring-border/70 transition-transform animate-in slide-in-from-right">
                  <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Signed in as</p>
                      <p className="text-base font-semibold text-foreground">{displayName}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMenuOpen(false)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition hover:border-primary/30 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      aria-label="Close menu"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-4 px-4 py-4">
                    <div className="space-y-2">
                      <p className="px-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Navigate</p>
                      <div className="flex flex-col gap-2">
                        {navItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = activeView === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                onChangeView(item.id);
                                setMenuOpen(false);
                              }}
                              className={`user-menu__item ${isActive ? 'user-menu__item--active' : ''}`}
                              aria-current={isActive ? 'page' : undefined}
                            >
                              <span className="user-menu__icon" aria-hidden>
                                <Icon size={16} />
                              </span>
                              <span className="user-menu__label">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="px-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Quick actions</p>
                      <ul className="user-menu__list">
                        {menuItems.map((item) => {
                          const Icon = item.icon;
                          const isDestructive = item.variant === 'destructive';
                          const isActive = item.isActive;
                          return (
                            <li key={item.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  item.action();
                                  setMenuOpen(false);
                                }}
                                className={`user-menu__item ${
                                  isActive ? 'user-menu__item--active' : ''
                                } ${isDestructive ? 'user-menu__item--danger' : ''}`}
                                aria-current={isActive ? 'true' : undefined}
                              >
                                <span className="user-menu__icon" aria-hidden>
                                  <Icon size={16} />
                                </span>
                                <span className="user-menu__label">{item.label}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </aside>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="hidden border-t border-border/70 bg-background/90 md:block">
        <div className="mx-auto w-full max-w-6xl">
          <nav className="primary-nav" aria-label="Primary navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onChangeView(item.id)}
                  className={`primary-nav__item ${isActive ? 'primary-nav__item--active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
