import {
  Sun,
  Moon,
  Menu,
} from 'lucide-react';

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
  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-end gap-3 px-4 md:px-6">
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
    </header>
  );
}
