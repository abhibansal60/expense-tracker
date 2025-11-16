import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Loader2, UserCircle2 } from 'lucide-react';
import {
  HOUSEHOLD_MEMBERS,
  type HouseholdMember,
  type HouseholdMemberId,
} from '../../shared/householdMembers';

const STORAGE_KEY = 'expense-tracker:household-member';

interface HouseholdUserContextValue {
  user: HouseholdMember;
  clearUser: () => void;
  selectUser: (memberId: HouseholdMemberId) => void;
}

const HouseholdUserContext = createContext<HouseholdUserContextValue | undefined>(undefined);

export function useHouseholdUser() {
  const context = useContext(HouseholdUserContext);
  if (!context) {
    throw new Error('useHouseholdUser must be used within a HouseholdUserGate');
  }
  return context;
}

export function HouseholdUserGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'prompt' | 'ready'>('loading');
  const [selectedUser, setSelectedUser] = useState<HouseholdMember | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const storedId = window.localStorage.getItem(STORAGE_KEY) as HouseholdMemberId | null;
    if (!storedId) {
      setStatus('prompt');
      return;
    }

    const member = HOUSEHOLD_MEMBERS.find((entry) => entry.id === storedId) ?? null;
    if (member) {
      setSelectedUser(member);
      setStatus('ready');
    } else {
      setStatus('prompt');
    }
  }, []);

  const handleSelect = (memberId: HouseholdMemberId) => {
    const member = HOUSEHOLD_MEMBERS.find((entry) => entry.id === memberId);
    if (!member) {
      return;
    }
    setSelectedUser(member);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, member.id);
    }
    setStatus('ready');
  };

  const clearUser = () => {
    setSelectedUser(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setStatus('prompt');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-3">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-white" aria-label="Loading profile" />
          <p className="text-sm text-white/70">Checking who is using this device...</p>
        </div>
      </div>
    );
  }

  if (status === 'prompt' || !selectedUser) {
    return <ProfilePrompt onSelect={handleSelect} />;
  }

  return (
    <HouseholdUserContext.Provider
      value={{
        user: selectedUser,
        clearUser,
        selectUser: handleSelect,
      }}
    >
      {children}
    </HouseholdUserContext.Provider>
  );
}

function ProfilePrompt({ onSelect }: { onSelect: (memberId: HouseholdMemberId) => void }) {
  const options = useMemo(() => HOUSEHOLD_MEMBERS, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white px-6">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 text-center space-y-4">
        <UserCircle2 className="mx-auto h-10 w-10 text-white" aria-hidden="true" />
        <div>
          <h1 className="text-2xl font-semibold">Who&apos;s logging expenses?</h1>
          <p className="text-sm text-white/80">
            Pick your name once per device and we&apos;ll tag every entry with it automatically.
          </p>
        </div>
        <div className="grid gap-3">
          {options.map((member) => (
            <button
              key={member.id}
              className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-4 text-lg font-semibold transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              onClick={() => onSelect(member.id)}
            >
              {member.name}
            </button>
          ))}
        </div>
        <p className="text-xs text-white/70">
          We store your choice locally so only this device remembers it.
        </p>
      </div>
    </div>
  );
}
