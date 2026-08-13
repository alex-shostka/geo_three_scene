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

type PanelId = 'menu' | 'analytics' | 'network';

interface UiContextValue {
  activePanel: PanelId | null;
  menuOpen: boolean;
  toggleMenu: () => void;
  analyticsOpen: boolean;
  toggleAnalytics: () => void;
  networkOpen: boolean;
  toggleNetwork: () => void;
  tileCard: TileCardState;
  openTileCard: (title: string, sections: TileCardSection[], message?: string) => void;
  closeTileCard: () => void;
  tooltip: TooltipState | null;
  setTooltip: (tooltip: TooltipState | null) => void;
}

const UiContext = createContext<UiContextValue | null>(null);

const EMPTY_TILE_CARD: TileCardState = { open: false, title: 'Tile', sections: [] };

export function UiProvider({ children }: { children: ReactNode }) {
  const [activePanel, setActivePanel] = useState<PanelId | null>(null);
  const [tileCard, setTileCard] = useState<TileCardState>(EMPTY_TILE_CARD);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const toggleMenu = useCallback(() => {
    setActivePanel((v) => (v === 'menu' ? null : 'menu'));
  }, []);
  const toggleAnalytics = useCallback(() => {
    setActivePanel((v) => (v === 'analytics' ? null : 'analytics'));
  }, []);
  const toggleNetwork = useCallback(() => {
    setActivePanel((v) => (v === 'network' ? null : 'network'));
  }, []);
  const openTileCard = useCallback((title: string, sections: TileCardSection[], message?: string) => {
    setTileCard({ open: true, title, sections, message });
  }, []);
  const closeTileCard = useCallback(() => setTileCard((s) => ({ ...s, open: false })), []);

  const value = useMemo<UiContextValue>(() => ({
    activePanel,
    menuOpen: activePanel === 'menu',
    toggleMenu,
    analyticsOpen: activePanel === 'analytics',
    toggleAnalytics,
    networkOpen: activePanel === 'network',
    toggleNetwork,
    tileCard, openTileCard, closeTileCard, tooltip, setTooltip,
  }), [activePanel, toggleMenu, toggleAnalytics, toggleNetwork, tileCard, openTileCard, closeTileCard, tooltip]);

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi(): UiContextValue {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUi must be used within UiProvider');
  return ctx;
}
