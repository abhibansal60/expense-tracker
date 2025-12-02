import { Sun, Moon, Menu, EyeOff } from 'lucide-react';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenSidebar: () => void;
  sidebarOpen: boolean;
  onActivatePrivacyLock: () => void;
}

export function Header({
  theme,
  onToggleTheme,
  onOpenSidebar,
  sidebarOpen,
  onActivatePrivacyLock,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.9),rgba(255,255,255,0)),linear-gradient(135deg,rgb(var(--ui-primary))_0%,rgb(var(--ui-primary)/0.85)_100%)] text-primary-foreground shadow-[0_10px_30px_rgba(0,0,0,0.15)] ring-1 ring-border/60">
            <span className="text-base font-semibold tracking-tight">ET</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">Expense Tracker</p>
            <p className="text-sm font-semibold text-foreground">Personal workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border/70 bg-background px-4 text-muted-foreground shadow-sm transition-all hover:-translate-y-[1px] hover:border-primary/40 hover:bg-muted/70 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon size={18} strokeWidth={2} /> : <Sun size={18} strokeWidth={2} />}
            <span className="hidden sm:inline text-sm font-medium">{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
            <span className="sr-only">Toggle theme</span>
          </button>

          <button
            onClick={onActivatePrivacyLock}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border/70 bg-background px-4 text-muted-foreground shadow-sm transition-all hover:-translate-y-[1px] hover:border-primary/40 hover:bg-muted/70 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
            title="Hide the screen"
          >
            <EyeOff size={18} strokeWidth={2} />
            <span className="hidden sm:inline text-sm font-medium">Hide screen</span>
            <span className="sr-only">Hide screen</span>
          </button>

          <button
            onClick={onOpenSidebar}
            className={`
              inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border/70 bg-primary/90 px-4 text-primary-foreground shadow-[0_12px_30px_rgba(99,102,241,0.35)] transition-all hover:-translate-y-[1px] hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary/25
              ${sidebarOpen ? 'ring-2 ring-primary/25' : ''}
            `}
            aria-expanded={sidebarOpen}
            aria-label="Open user menu"
          >
            <Menu size={18} strokeWidth={2.25} />
            <span className="hidden sm:inline text-sm font-semibold tracking-tight">Menu</span>
          </button>
        </div>
      </div>
    </header>
  );
}
