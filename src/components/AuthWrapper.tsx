import { type ReactNode, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { api } from '../../convex/_generated/api';

interface AuthWrapperProps {
  children: ReactNode;
}

function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600" />
        <p className="mt-2 text-sm text-gray-600">Loading your expenses...</p>
      </div>
    </div>
  );
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const ensureGuestUser = useMutation(api.users.syncCurrentUser);
  const user = useQuery(api.users.getCurrentUser);

  useEffect(() => {
    void ensureGuestUser();
  }, [ensureGuestUser]);
  
  if (user === undefined) {
    return <LoadingPage />;
  }

  return (
    <>
      <GuestModeBanner userName={user?.name} />
      {children}
    </>
  );
}

function GuestModeBanner({ userName }: { userName?: string | null }) {
  return (
    <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex items-start gap-3">
      <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400" />
      <div>
        <p className="font-medium">Guest mode active</p>
        <p>
          Authentication is temporarily disabled. All changes are saved under{' '}
          <strong>{userName || 'Demo User'}</strong>.
        </p>
      </div>
    </div>
  );
}
