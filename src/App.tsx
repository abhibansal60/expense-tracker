import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { ExpenseTracker } from './components/ExpenseTracker';
import { Header } from './components/Header';
import { AuthWrapper } from './components/AuthWrapper';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL!);

function App() {
  return (
    <ConvexProvider client={convex}>
      <ConvexAuthProvider client={convex}>
        <div className="min-h-screen">
          <Header />
          <main className="container" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
            <AuthWrapper>
              <ExpenseTracker />
            </AuthWrapper>
          </main>
        </div>
      </ConvexAuthProvider>
    </ConvexProvider>
  );
}

export default App;
