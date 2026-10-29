import type { ReactNode } from 'react';
import { usePanelContext } from './PanelContext';

interface PanelToggleProps {
  id: string;
  label: string;
  children: ReactNode;
}

export function PanelTrigger({ id, label, children }: PanelToggleProps) {
  const { id: panelId, open, onToggle } = usePanelContext();

  return (
    <button
      id={id}
      className="float-btn glass"
      aria-label={label}
      aria-expanded={open}
      aria-controls={panelId}
      onClick={onToggle}
    >
      {children}
    </button>
  );
}
