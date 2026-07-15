import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ErrorTileRecord, TileCardSection } from '../types';

interface TileCardState {
  open: boolean;
  title: string;
  sections: TileCardSection[];
  message?: string;
}

export interface TooltipState {
  x: number;
  y: number;
  record: ErrorTileRecord;
}

interface UiContextValue {
  menuOpen: boolean;
  toggleMenu: () => void;
  tileCard: TileCardState;
  openTileCard: (title: string, sections: TileCardSection[], message?: string) => void;
  closeTileCard: () => void;
  tooltip: TooltipState | null;
  setTooltip: (tooltip: TooltipState | null) => void;
}

const UiContext = createContext<UiContextValue | null>(null);

const EMPTY_TILE_CARD: TileCardState = { open: false, title: 'Tile', sections: [] };

export function UiProvider({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [tileCard, setTileCard] = useState<TileCardState>(EMPTY_TILE_CARD);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const toggleMenu = useCallback(() => setMenuOpen((v) => !v), []);
  const openTileCard = useCallback((title: string, sections: TileCardSection[], message?: string) => {
    setTileCard({ open: true, title, sections, message });
  }, []);
  const closeTileCard = useCallback(() => setTileCard((s) => ({ ...s, open: false })), []);

  const value = useMemo<UiContextValue>(() => ({
    menuOpen, toggleMenu, tileCard, openTileCard, closeTileCard, tooltip, setTooltip,
  }), [menuOpen, toggleMenu, tileCard, openTileCard, closeTileCard, tooltip]);

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi(): UiContextValue {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUi must be used within UiProvider');
  return ctx;
}
