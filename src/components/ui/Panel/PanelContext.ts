import { createContext, use } from 'react';

export interface PanelContextValue {
  id: string;
  titleId: string;
  open: boolean;
  onToggle: () => void;
}

export const PanelContext = createContext<PanelContextValue | null>(null);

export function usePanelContext(): PanelContextValue {
  const context = use(PanelContext);

  if (!context) {
    throw new Error('Panel.* must be rendered inside <Panel>');
  }

  return context;
}
