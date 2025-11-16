import { type ReactNode, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { Loader2, UserCircle2 } from 'lucide-react';
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
      <ProfileStatusBanner userName={user.name} onSwitchProfile={clearUser} />
      {children}
    </>
  );
}

function ProfileStatusBanner({
  userName,
  onSwitchProfile,
}: {
  userName: string;
  onSwitchProfile: () => void;
}) {
  return (
    <div className="profile-banner" data-section="profile">
      <div className="profile-banner__icon" aria-hidden="true">
        <UserCircle2 className="h-4 w-4 text-primary-600" />
      </div>
      <div className="space-y-0.5">
        <p className="font-semibold text-sm text-slate-900 dark:text-white">Working as {userName}</p>
        <p className="text-sm text-slate-600 dark:text-slate-200/80">
          Switching profiles keeps expenses tagged to the right person.
        </p>
      </div>
      <button
        type="button"
        className="ml-auto text-sm font-semibold text-primary-700 underline decoration-dotted decoration-primary-300/70 hover:text-primary-900 dark:text-primary-200 dark:hover:text-white"
        onClick={onSwitchProfile}
      >
        Switch profile
      </button>
    </div>
  );
}
