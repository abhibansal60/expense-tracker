import { useState, type FormEvent } from 'react';
import { Clock3, Eye, EyeOff, Loader2, Lock, Shield } from 'lucide-react';
import { hasAccessCode, verifyPassphrase } from '../utils/access';

interface PrivacyBannerProps {
  locked: boolean;
  onLock: () => void;
  onUnlock: () => void;
}

export function PrivacyBanner({ locked, onLock, onUnlock }: PrivacyBannerProps) {
  const requiresPassphrase = hasAccessCode();
  const [passphrase, setPassphrase] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleUnlock = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!requiresPassphrase) {
      onUnlock();
      return;
    }

    setSubmitting(true);
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
    <section className="privacy-banner" aria-live="polite">
      <div className="privacy-banner__meta">
        <div className="privacy-banner__icon" aria-hidden="true">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <p className="privacy-banner__eyebrow">Privacy</p>
          <p className="privacy-banner__title">{locked ? 'Numbers are hidden' : 'Numbers are visible'}</p>
          <p className="privacy-banner__helper">
            {locked
              ? 'Sensitive totals are masked until you unlock them.'
              : 'You can hide them again anytime or after inactivity.'}
          </p>
        </div>
      </div>

      <div className="privacy-banner__controls">
        <div className="privacy-banner__chips" aria-hidden="true">
          <span className="privacy-chip">
            <Lock className="h-3 w-3" /> Locks on open
          </span>
          <span className="privacy-chip ghost">
            <Clock3 className="h-3 w-3" /> Auto-locks after 2 minutes idle
          </span>
        </div>

        {locked ? (
          <form className="privacy-banner__form" onSubmit={handleUnlock}>
            {requiresPassphrase && (
              <label className="sr-only" htmlFor="privacy-passphrase-inline">
                Passphrase to show numbers
              </label>
            )}
            <div className="privacy-banner__input">
              {requiresPassphrase ? (
                <>
                  <input
                    id="privacy-passphrase-inline"
                    type="password"
                    className="input-field"
                    placeholder="Enter passphrase to show numbers"
                    value={passphrase}
                    onChange={(event) => setPassphrase(event.target.value)}
                    disabled={submitting}
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={submitting || passphrase.trim().length === 0}
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : 'Show numbers'}
                  </button>
                </>
              ) : (
                <button type="submit" className="btn-primary">
                  <Eye className="h-4 w-4" />
                  <span>Show numbers</span>
                </button>
              )}
            </div>
            {error && (
              <p className="auth-card__error" role="alert">
                {error}
              </p>
            )}
          </form>
        ) : (
          <button type="button" className="btn-secondary privacy-banner__toggle" onClick={onLock}>
            <EyeOff className="h-4 w-4" />
            <span>Hide numbers</span>
          </button>
        )}
      </div>
    </section>
  );
}
