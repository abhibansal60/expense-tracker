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
    <div className="guest-banner" data-section="profile">
      <ShieldAlert className="h-5 w-5 shrink-0 text-amber-500" />
      <div>
        <p className="font-semibold">Guest mode active</p>
        <p>
          Authentication is disabled. All changes are saved under{' '}
          <strong>{userName || 'Demo User'}</strong>.
        </p>
      </div>
    </div>
  );
}
