import { useState } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ExpenseTracker, type ExpenseTrackerPreferences } from './components/ExpenseTracker';
import { Header } from './components/Header';
import { AuthWrapper } from './components/AuthWrapper';
import { SettingsDialog } from './components/SettingsDialog';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL!);

function App() {
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState<ExpenseTrackerPreferences>({
    compactMode: false,
  });

  const toggleFilters = () => setFiltersVisible((prev) => !prev);
  const updatePreferences = (patch: Partial<ExpenseTrackerPreferences>) =>
    setPreferences((prev) => ({ ...prev, ...patch }));

  return (
    <ConvexProvider client={convex}>
      <div className="min-h-screen">
        <Header
          filtersActive={filtersVisible}
          onToggleFilters={toggleFilters}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        <main className="container" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
          <AuthWrapper>
            <ExpenseTracker
              showFilters={filtersVisible}
              onToggleFilters={toggleFilters}
              preferences={preferences}
            />
          </AuthWrapper>
        </main>
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
