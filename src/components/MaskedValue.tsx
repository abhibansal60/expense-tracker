import type { ElementType, ReactNode } from 'react';
import { usePrivacy } from './PrivacyContext';

interface MaskedValueProps {
  value: string;
  className?: string;
  maskChar?: string;
  as?: ElementType;
  children?: ReactNode;
}

export function MaskedValue({ value, className, maskChar, as: Component = 'span', children }: MaskedValueProps) {
  const { privacyLocked, maskValue } = usePrivacy();
  const display = privacyLocked ? maskValue(value, maskChar) : value;

  if (children) {
    return (
      <Component className={className}>
        {privacyLocked ? maskValue(String(children), maskChar) : children}
      </Component>
    );
  }

  return <Component className={className}>{display}</Component>;
}
