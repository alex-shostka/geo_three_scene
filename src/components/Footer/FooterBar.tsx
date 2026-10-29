import type { ReactNode } from 'react';

interface FooterBarProps {
  children: ReactNode;
}

export function FooterBar({ children }: FooterBarProps) {
  return <div id="footer-bar">{children}</div>;
}
