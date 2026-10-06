import type { ReactNode } from 'react';
import { panelElementId } from '../lib/panelElementId';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectIsPanelOpen, togglePanel, type PanelId } from '../store/uiSlice';

interface PanelToggleButtonProps {
  id: string;
  panel: PanelId;
  label: string;
  children: ReactNode;
}

export function PanelToggleButton({ id, panel, label, children }: PanelToggleButtonProps) {
  const open = useAppSelector((s) => selectIsPanelOpen(s, panel));
  const dispatch = useAppDispatch();

  return (
    <button
      id={id}
      className="float-btn glass"
      aria-label={label}
      aria-expanded={open}
      aria-controls={panelElementId(panel)}
      onClick={() => dispatch(togglePanel(panel))}
    >
      {children}
    </button>
  );
}
