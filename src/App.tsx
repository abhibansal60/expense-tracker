import { useEffect, useState } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ExpenseTracker, type ExpenseTrackerPreferences, type TrackerView } from './components/ExpenseTracker';
import { Header } from './components/Header';
import { AuthWrapper } from './components/AuthWrapper';
import { SettingsDialog } from './components/SettingsDialog';
import { MobileNav } from './components/MobileNav';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL!);

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
    <ConvexProvider client={convex}>
      <div className="app-shell">
        <div className="mobile-frame" data-theme={theme}>
          <div className="mobile-gradient" aria-hidden="true" />
          <div className="mobile-scroll">
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
  );
}

export default App;
