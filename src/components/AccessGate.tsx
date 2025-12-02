import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { ACCESS_CODE_HASH, getAccessStorageKey, sha256Hex } from '../utils/access';

export function AccessGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'checking' | 'prompt' | 'granted'>('checking');
  const [passphrase, setPassphrase] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ACCESS_CODE_HASH) {
      setStatus('granted');
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }
    const stored = window.localStorage.getItem(getAccessStorageKey());
    if (stored && stored === ACCESS_CODE_HASH) {
      setStatus('granted');
      return;
    }
    setStatus('prompt');
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ACCESS_CODE_HASH) {
      setStatus('granted');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const hashed = await sha256Hex(passphrase.trim());
      if (hashed === ACCESS_CODE_HASH) {
        window.localStorage.setItem(getAccessStorageKey(), hashed);
        setStatus('granted');
      } else {
        setError('That access phrase is incorrect. Try again.');
      }
    } catch (hashError) {
      console.error('Unable to verify access phrase', hashError);
      setError('We could not verify that passphrase in this browser. Try again or switch to a different one.');
    } finally {
      setSubmitting(false);
      setPassphrase('');
    }
  };

  if (status === 'granted') {
    return <>{children}</>;
  }

  const isLoading = status === 'checking';

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-card__icon">
          {isLoading ? (
            <Loader2 className="h-8 w-8 animate-spin" aria-label="Checking access" />
          ) : (
            <Lock className="h-8 w-8" aria-hidden="true" />
          )}
        </div>
        <h1 className="auth-card__title">Family Access Gate</h1>
        <p className="auth-card__subtitle">
          This deployment is private. Enter the shared passphrase to continue.
        </p>
        {!isLoading && (
          <form onSubmit={handleSubmit} className="auth-card__form">
            <label className="auth-card__label">Access phrase</label>
            <input
              type="password"
              className="input-field"
              value={passphrase}
              onChange={(event) => setPassphrase(event.target.value)}
              placeholder="Enter passphrase"
              disabled={submitting}
              autoComplete="off"
            />
            {error && (
              <p className="auth-card__error" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="btn-primary w-full justify-center"
              disabled={submitting || passphrase.trim().length === 0}
            >
              {submitting ? 'Verifying...' : 'Unlock'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
