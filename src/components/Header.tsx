import {
  Sun,
  Moon,
  Menu,
} from 'lucide-react';
import { useHouseholdUser } from './HouseholdUserGate';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenSidebar: () => void;
  sidebarOpen: boolean;
}

export function Header({
  theme,
  onToggleTheme,
  onOpenSidebar,
  sidebarOpen,
}: HeaderProps) {
  const { user } = useHouseholdUser();
  const displayName = user.name;
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((name) => name.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

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

          <button
            onClick={onOpenSidebar}
            className={`
              inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground transition-all hover:border-primary/30 hover:bg-muted/70 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20
              ${sidebarOpen ? 'border-primary/40 ring-2 ring-primary/20' : ''}
            `}
            aria-expanded={sidebarOpen}
            aria-label="Open user menu"
          >
            <Menu size={20} strokeWidth={2} />
          </button>
        </div>
      </div>
    </header>
  );
}
