import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { Loader2, Lock } from 'lucide-react';

const STORAGE_KEY = 'expense-tracker:access-hash';
const ACCESS_CODE_HASH = import.meta.env.VITE_ACCESS_CODE_HASH;

async function sha256Hex(input: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

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
    const stored = window.localStorage.getItem(STORAGE_KEY);
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
        window.localStorage.setItem(STORAGE_KEY, hashed);
        setStatus('granted');
      } else {
        setError('That access phrase is incorrect. Try again.');
      }
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
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white px-6">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 text-center">
        {isLoading ? (
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-white" aria-label="Checking access" />
        ) : (
          <Lock className="mx-auto h-8 w-8 text-white" aria-hidden="true" />
        )}
        <h1 className="mt-4 text-2xl font-semibold">Family Access Gate</h1>
        <p className="mt-2 text-sm text-white/80">
          This deployment is private. Enter the shared passphrase to continue.
        </p>
        {!isLoading && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3 text-left">
            <label className="block text-xs uppercase tracking-widest text-white/70">Access phrase</label>
            <input
              type="password"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white"
              value={passphrase}
              onChange={(event) => setPassphrase(event.target.value)}
              placeholder="Enter passphrase"
              disabled={submitting}
              autoComplete="off"
            />
            {error && <p className="text-sm text-rose-200">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-2xl bg-white text-slate-900 font-semibold py-3 transition hover:bg-slate-100 disabled:opacity-50"
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
