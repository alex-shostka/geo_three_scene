import { useState, type ReactNode } from 'react';
import { FooterContext } from './FooterContext';

const CONTENT_ID = 'footer-content';

interface FooterRootProps {
  defaultOpen?: boolean;
  children: ReactNode;
}

export function FooterRoot({ defaultOpen = false, children }: FooterRootProps) {
  const [open, setOpen] = useState(defaultOpen);
  const toggle = () => setOpen((current) => !current);

  return (
    <FooterContext value={{ open, toggle, contentId: CONTENT_ID }}>
      <footer id="app-footer" className={open ? 'open' : ''}>
        {children}
      </footer>
    </FooterContext>
  );
}
