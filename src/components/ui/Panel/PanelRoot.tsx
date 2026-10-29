import type { ReactNode } from 'react';
import { PanelContext } from './PanelContext';

interface PanelRootProps {
  id: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function PanelRoot({ id, open, onToggle, children }: PanelRootProps) {
  const titleId = `${id}-title`;

  return <PanelContext value={{ id, titleId, open, onToggle }}>{children}</PanelContext>;
}
