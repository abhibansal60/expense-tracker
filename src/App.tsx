import { useEffect, useState } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ExpenseTracker, type ExpenseTrackerPreferences, type TrackerView } from './components/ExpenseTracker';
import { Header } from './components/Header';
import { AuthWrapper } from './components/AuthWrapper';
import { SettingsDialog } from './components/SettingsDialog';
import { MobileNav } from './components/MobileNav';
import { AccessGate } from './components/AccessGate';
import { HouseholdUserGate } from './components/HouseholdUserGate';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL!);
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
  const [activeView, setActiveView] = useState<TrackerView>('overview');
  const [preferences, setPreferences] = useState<ExpenseTrackerPreferences>({
    compactMode: false,
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    return 'dark';
  });

  const toggleFilters = () => setFiltersVisible((prev) => !prev);
  const updatePreferences = (patch: Partial<ExpenseTrackerPreferences>) =>
    setPreferences((prev) => ({ ...prev, ...patch }));
  const handleViewChange = (view: TrackerView) => setActiveView(view);
  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <AccessGate>
      <HouseholdUserGate>
        <ConvexProvider client={convex}>
          <div className="app-shell">
            <div className="mobile-frame" data-theme={theme}>
              <div className="mobile-gradient" aria-hidden="true" />
              <div className="mobile-scroll">
                <div className="workspace-grid">
                  <Header
                    filtersActive={filtersVisible}
                    onToggleFilters={toggleFilters}
                    onOpenSettings={() => setSettingsOpen(true)}
                    theme={theme}
                    onToggleTheme={toggleTheme}
                  />
                  <main className="screen" role="main">
                    <AuthWrapper>
                      <ExpenseTracker
                        showFilters={filtersVisible}
                        onToggleFilters={toggleFilters}
                        preferences={preferences}
                        activeView={activeView}
                        onChangeView={handleViewChange}
                      />
                    </AuthWrapper>
                  </main>
                </div>
                <footer className="version-footer" aria-label="Application version information">
                  <div>
                    <div className="version-footer__label">App version</div>
                    <div className="version-footer__meta">
                      {buildTimeLabel ? `Built ${buildTimeLabel}` : 'Build time unavailable'}
                    </div>
                  </div>
                  <span className="version-footer__value">{__APP_VERSION__}</span>
                </footer>
              </div>
              <MobileNav active={activeView} onNavigate={handleViewChange} />
            </div>
            <SettingsDialog
              isOpen={settingsOpen}
              preferences={preferences}
              onUpdatePreferences={updatePreferences}
              onClose={() => setSettingsOpen(false)}
            />
          </div>
        </ConvexProvider>
      </HouseholdUserGate>
    </AccessGate>
  );
}

export default App;
