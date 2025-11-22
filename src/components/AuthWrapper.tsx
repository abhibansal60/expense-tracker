import { type ReactNode, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { Loader2 } from 'lucide-react';
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
  const { user } = useHouseholdUser();

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
    <>{children}</>
  );
}
