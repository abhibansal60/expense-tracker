import { createContext, useContext, useMemo, type ReactNode } from 'react';

interface PrivacyContextValue {
  privacyLocked: boolean;
  maskValue: (value: string, maskChar?: string) => string;
}

const PrivacyContext = createContext<PrivacyContextValue | null>(null);

export function PrivacyProvider({ locked, children }: { locked: boolean; children: ReactNode }) {
  const value = useMemo<PrivacyContextValue>(
    () => ({
      privacyLocked: locked,
      maskValue: (value: string, maskChar = '•') => {
        if (!locked) {
          return value;
        }

        const trimmed = value.trim();
        const leadingSymbolsMatch = trimmed.match(/^[+\-–—]?\s*[£$€¥₹]?/);
        const leadingSymbols = leadingSymbolsMatch?.[0] ?? '';
        const numericLength = Math.max(trimmed.replace(/[^0-9]/g, '').length, 3);
        const mask = maskChar.repeat(Math.min(Math.max(numericLength, 4), 8));

        return `${leadingSymbols}${mask}`;
      },
    }),
    [locked]
  );

  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>;
}

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
}
