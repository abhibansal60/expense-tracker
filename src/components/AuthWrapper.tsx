import { type ReactNode, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { useHouseholdUser } from './HouseholdUserGate';

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
  const ensureUserProfile = useMutation(api.users.syncCurrentUser);
  const { user, clearUser } = useHouseholdUser();

  useEffect(() => {
    if (!user) {
      return;
    }
    void ensureUserProfile({ memberId: user.id });
  }, [ensureUserProfile, user]);
  
  if (!user) {
    return <LoadingPage />;
  }

  return (
    <>
      <GuestModeBanner userName={user.name} onSwitchProfile={clearUser} />
      {children}
    </>
  );
}

function GuestModeBanner({
  userName,
  onSwitchProfile,
}: {
  userName: string;
  onSwitchProfile: () => void;
}) {
  return (
    <div className="guest-banner" data-section="profile">
      <ShieldAlert className="h-5 w-5 shrink-0 text-amber-500" />
      <div>
        <p className="font-semibold">Guest mode active</p>
        <p>
          Authentication is disabled. All changes are saved under{' '}
          <strong>{userName}</strong>.
        </p>
      </div>
      <button
        type="button"
        className="ml-auto text-sm font-semibold text-amber-700 underline decoration-dotted decoration-amber-500/70 hover:text-amber-900"
        onClick={onSwitchProfile}
      >
        Switch profile
      </button>
    </div>
  );
}
