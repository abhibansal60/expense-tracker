const STORAGE_KEY = 'expense-tracker:access-hash';
export const ACCESS_CODE_HASH = import.meta.env.VITE_ACCESS_CODE_HASH;

export function getAccessStorageKey() {
  return STORAGE_KEY;
}

export async function sha256Hex(input: string) {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    throw new Error('Secure hashing is not available in this browser.');
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function hasAccessCode() {
  return Boolean(ACCESS_CODE_HASH);
}

export async function verifyPassphrase(passphrase: string) {
  if (!ACCESS_CODE_HASH) {
    return true;
  }

  const hashed = await sha256Hex(passphrase.trim());
  return hashed === ACCESS_CODE_HASH;
}
