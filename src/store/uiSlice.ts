import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ErrorTileRecord, TileCardSection } from '../types';
import type { ANALYTICS_PANEL, MENU_PANEL, NETWORK_PANEL } from '../constants';

export type PanelId = typeof MENU_PANEL | typeof ANALYTICS_PANEL | typeof NETWORK_PANEL;

export interface TileCardState {
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

interface UiState {
  activePanel: PanelId | null;
  tileCard: TileCardState;
  tooltip: TooltipState | null;
}

const initialState: UiState = {
  activePanel: null,
  tileCard: { open: false, title: 'Tile', sections: [] },
  tooltip: null,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    togglePanel(state, action: PayloadAction<PanelId>) {
      state.activePanel = state.activePanel === action.payload ? null : action.payload;
    },
    openTileCard(state, action: PayloadAction<Omit<TileCardState, 'open'>>) {
      state.tileCard = { open: true, ...action.payload };
    },
    closeTileCard(state) {
      state.tileCard.open = false;
    },
    setTooltip(state, action: PayloadAction<TooltipState | null>) {
      state.tooltip = action.payload;
    },
  },
  selectors: {
    selectIsPanelOpen: (state, panel: PanelId) => state.activePanel === panel,
    selectTileCard: (state) => state.tileCard,
    selectTooltip: (state) => state.tooltip,
  },
});

export const { togglePanel, openTileCard, closeTileCard, setTooltip } = uiSlice.actions;
export const { selectIsPanelOpen, selectTileCard, selectTooltip } = uiSlice.selectors;
