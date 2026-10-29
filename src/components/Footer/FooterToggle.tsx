import type { ReactNode } from 'react';
import { useFooterContext } from './FooterContext';

interface FooterToggleProps {
  children: ReactNode;
}

export function FooterToggle({ children }: FooterToggleProps) {
  const { open, toggle, contentId } = useFooterContext();

  return (
    <button
      id="footer-toggle"
      aria-expanded={open}
      aria-controls={contentId}
      aria-label={open ? 'Collapse footer' : 'Expand footer'}
      onClick={toggle}
    >
      {children}
    </button>
  );
}
