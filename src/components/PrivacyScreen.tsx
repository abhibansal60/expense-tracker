import { type FormEvent, useState } from 'react';
import { EyeOff, Loader2, Lock, Shield } from 'lucide-react';
import { hasAccessCode, verifyPassphrase } from '../utils/access';

interface PrivacyScreenProps {
  onUnlock: () => void;
}

export function PrivacyScreen({ onUnlock }: PrivacyScreenProps) {
  const [passphrase, setPassphrase] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const requiresPassphrase = hasAccessCode();

  const handleUnlock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!requiresPassphrase) {
      onUnlock();
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const isValid = await verifyPassphrase(passphrase);
      if (isValid) {
        onUnlock();
      } else {
        setError('That access phrase is incorrect.');
      }
    } catch (unlockError) {
      console.error('Unable to verify access phrase for privacy lock', unlockError);
      setError('We could not verify that passphrase in this browser.');
    } finally {
      setSubmitting(false);
      setPassphrase('');
    }
  };

  return (
    <div className="privacy-overlay" role="dialog" aria-modal="true" aria-label="Privacy lock screen">
      <div className="privacy-panel">
        <div className="privacy-icon">
          <Shield className="h-10 w-10" aria-hidden="true" />
        </div>
        <div className="privacy-header">
          <div>
            <p className="privacy-badge">Privacy lock</p>
            <h2>Screen hidden</h2>
            <p>
              Your expense history and balances are blurred. Unlock the screen before handing your phone back.
            </p>
          </div>
          <EyeOff className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>

        <div className="privacy-actions">
          <div className="privacy-note">
            <Lock className="h-4 w-4" aria-hidden="true" />
            <span>
              {requiresPassphrase
                ? 'This view stays locked until you re-enter the access phrase.'
                : 'Tap unlock when you are ready to show your expenses again.'}
            </span>
          </div>

          <form className="privacy-form" onSubmit={handleUnlock}>
            <label className="auth-card__label" htmlFor="privacy-passphrase">
              Access phrase
            </label>
            <div className="privacy-input-row">
              <input
                id="privacy-passphrase"
                type="password"
                className="input-field"
                value={passphrase}
                onChange={(event) => setPassphrase(event.target.value)}
                placeholder={requiresPassphrase ? 'Enter passphrase to unlock' : 'Tap unlock to continue'}
                disabled={submitting || !requiresPassphrase}
                autoComplete="off"
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting || (requiresPassphrase && passphrase.trim().length === 0)}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : 'Unlock'}
              </button>
            </div>
            {error && (
              <p className="auth-card__error" role="alert">
                {error}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
