import { useCallback, useEffect, useState } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ExpenseTracker, type ExpenseTrackerPreferences, type TrackerView } from './components/ExpenseTracker';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AuthWrapper } from './components/AuthWrapper';
import { SettingsDialog } from './components/SettingsDialog';
import { MobileNav } from './components/MobileNav';
import { AccessGate } from './components/AccessGate';
import { HouseholdUserGate } from './components/HouseholdUserGate';
import { PrivacyScreen } from './components/PrivacyScreen';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL!);
const THEME_STORAGE_KEY = 'expense-tracker:theme-preference';
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;

const getPreferredTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  return prefersLight ? 'light' : 'dark';
};

const buildTimeLabel = (() => {
  const parsedDate = new Date(__BUILD_TIME__);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return (
    parsedDate.toLocaleString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' UTC'
  );
})();

function App() {
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<TrackerView>('overview');
  const [preferences, setPreferences] = useState<ExpenseTrackerPreferences>({
    compactMode: false,
  });
  const [privacyLocked, setPrivacyLocked] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => getPreferredTheme());
  const [hasManualThemeChoice, setHasManualThemeChoice] = useState(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(window.localStorage.getItem(THEME_STORAGE_KEY));
  });

  const toggleFilters = () => setFiltersVisible((prev) => !prev);
  const updatePreferences = (patch: Partial<ExpenseTrackerPreferences>) =>
    setPreferences((prev) => ({ ...prev, ...patch }));
  const handleViewChange = (view: TrackerView) => setActiveView(view);
  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      }
      return next;
    });
    setHasManualThemeChoice(true);
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = (event: MediaQueryListEvent) => {
      if (!hasManualThemeChoice) {
        setTheme(event.matches ? 'light' : 'dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [hasManualThemeChoice]);

  const handleActivatePrivacyLock = useCallback(() => {
    setPrivacyLocked(true);
    setSidebarOpen(false);
    setSettingsOpen(false);
    setFiltersVisible(false);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let inactivityTimer: number | undefined;

    const resetInactivityTimer = () => {
      if (privacyLocked) return;

      if (inactivityTimer !== undefined) {
        window.clearTimeout(inactivityTimer);
      }

      inactivityTimer = window.setTimeout(() => {
        handleActivatePrivacyLock();
      }, INACTIVITY_TIMEOUT_MS);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleActivatePrivacyLock();
        if (inactivityTimer !== undefined) {
          window.clearTimeout(inactivityTimer);
        }
        return;
      }

      resetInactivityTimer();
    };

    const handleActivity = () => {
      resetInactivityTimer();
    };

    const activityEvents: Array<[Window, keyof WindowEventMap]> = [
      [window, 'pointermove'],
      [window, 'keydown'],
      [window, 'scroll'],
      [window, 'touchstart'],
    ];

    activityEvents.forEach(([target, event]) => target.addEventListener(event, handleActivity));
    document.addEventListener('visibilitychange', handleVisibilityChange);

    resetInactivityTimer();

    return () => {
      if (inactivityTimer !== undefined) {
        window.clearTimeout(inactivityTimer);
      }

      activityEvents.forEach(([target, event]) => target.removeEventListener(event, handleActivity));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleActivatePrivacyLock, privacyLocked]);

  return (
    <AccessGate>
      <HouseholdUserGate>
        <ConvexProvider client={convex}>
          <div className="min-h-screen bg-background font-sans antialiased selection:bg-primary/10 selection:text-primary" style={{ overflowX: 'hidden' }}>
            <Header
              theme={theme}
              onToggleTheme={toggleTheme}
              onOpenSidebar={() => setSidebarOpen(true)}
              sidebarOpen={sidebarOpen}
              onActivatePrivacyLock={handleActivatePrivacyLock}
            />

            <div className="hidden md:block">
              <Navbar active={activeView} onNavigate={handleViewChange} />
            </div>

            <Sidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              filtersActive={filtersVisible}
              onToggleFilters={toggleFilters}
              onOpenSettings={() => setSettingsOpen(true)}
              activeView={activeView}
              onChangeView={handleViewChange}
            />

            <main className="mx-auto w-full max-w-6xl px-4 pt-6 md:px-6 animate-in fade-in duration-500">
              <AuthWrapper>
                <ExpenseTracker
                  showFilters={filtersVisible}
                  onToggleFilters={toggleFilters}
                  preferences={preferences}
                  activeView={activeView}
                  onChangeView={handleViewChange}
                />
              </AuthWrapper>

              <footer className="mt-20 border-t py-8 text-center text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                  <span>Guest workspace synced</span>
                </div>
                <div className="flex items-center justify-center gap-4 opacity-60">
                  <span>{buildTimeLabel ? `Built ${buildTimeLabel}` : 'Build time unavailable'}</span>
                  <span>•</span>
                  <span>v{__APP_VERSION__}</span>
                </div>
              </footer>
            </main>

            <div className="md:hidden">
              <MobileNav active={activeView} onNavigate={handleViewChange} />
            </div>

            <SettingsDialog
              isOpen={settingsOpen}
              preferences={preferences}
              onUpdatePreferences={updatePreferences}
              onClose={() => setSettingsOpen(false)}
            />

            {privacyLocked && <PrivacyScreen onUnlock={() => setPrivacyLocked(false)} />}
          </div>
        </ConvexProvider>
      </HouseholdUserGate>
    </AccessGate>
  );
}

export default App;
