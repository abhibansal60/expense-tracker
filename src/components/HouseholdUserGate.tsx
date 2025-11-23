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
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-card__icon">
            <Loader2 className="h-8 w-8 animate-spin" aria-label="Loading profile" />
          </div>
          <p className="auth-card__subtitle">Checking who is using this device...</p>
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
    <div className="auth-shell">
      <div className="auth-card auth-card--stacked">
        <div className="auth-card__icon">
          <UserCircle2 className="h-10 w-10" aria-hidden="true" />
        </div>
        <div>
          <h1 className="auth-card__title">Who&apos;s logging expenses?</h1>
          <p className="auth-card__subtitle">
            Pick your name once per device and we&apos;ll tag every entry with it automatically.
          </p>
        </div>
        <div className="auth-card__options">
          {options.map((member) => (
            <button
              key={member.id}
              className="pill-button auth-card__option"
              onClick={() => onSelect(member.id)}
            >
              <span className="auth-card__option-label">{member.name}</span>
              <span className="auth-card__option-hint">Choose profile</span>
            </button>
          ))}
        </div>
        <p className="auth-card__footnote">
          We store your choice locally so only this device remembers it.
        </p>
      </div>
    </div>
  );
}
