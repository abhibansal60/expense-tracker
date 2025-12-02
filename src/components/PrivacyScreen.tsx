import { type FormEvent, useState } from 'react';
import { Clock3, EyeOff, Loader2, Lock, RefreshCcw, Shield } from 'lucide-react';
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
        <div className="privacy-icon" aria-hidden="true">
          <Shield className="h-10 w-10" />
        </div>

        <div className="privacy-header">
          <div>
            <p className="privacy-badge">Privacy lock</p>
            <h2>Numbers are hidden</h2>
            <p>
              Your balances and history stay blurred until you unlock them. We automatically hide the screen on every launch and
              whenever you are away for a few minutes.
            </p>
          </div>
          <EyeOff className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>

        <div className="privacy-meta">
          <span className="privacy-chip">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            Locks on open
          </span>
          <span className="privacy-chip ghost">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            Auto-locks after 5 minutes idle
          </span>
          <span className="privacy-chip ghost">
            <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Unlock resets the timer
          </span>
        </div>

        <div className="privacy-body">
          <div className="privacy-note">
            <Lock className="h-4 w-4" aria-hidden="true" />
            <span>
              {requiresPassphrase
                ? 'Enter the access phrase you set to reveal totals. The screen will hide itself again after a few minutes.'
                : 'Tap unlock when you are ready to show your expenses again. We will auto-hide after a few minutes of inactivity.'}
            </span>
          </div>

          <div className="privacy-tips">
            <div className="privacy-tip">
              <Shield className="h-4 w-4" aria-hidden="true" />
              <div>
                <p className="privacy-tip__title">Built for quick handoffs</p>
                <p className="privacy-tip__text">Keep totals hidden while someone else holds your phone.</p>
              </div>
            </div>
            <div className="privacy-tip">
              <Clock3 className="h-4 w-4" aria-hidden="true" />
              <div>
                <p className="privacy-tip__title">Smart idle detection</p>
                <p className="privacy-tip__text">We hide the screen after five minutes without activity or when you switch apps.</p>
              </div>
            </div>
          </div>
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
          <p className="privacy-helper">You can still toggle theme and navigation while the privacy lock is active.</p>
          {error && (
            <p className="auth-card__error" role="alert">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
