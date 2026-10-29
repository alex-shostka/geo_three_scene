import type { ReactNode } from 'react';
import { useFooterContext } from './FooterContext';

interface FooterContentProps {
  children: ReactNode;
}

export function FooterContent({ children }: FooterContentProps) {
  const { open, contentId } = useFooterContext();

  return (
    <div id={contentId} inert={!open}>
      {children}
    </div>
  );
}
