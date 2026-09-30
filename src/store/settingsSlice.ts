import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface SettingsState {
  activeTilesOnScene: boolean;
  flyToTile: boolean;
  tileGridOnGlobe: boolean;
  glbTiles: boolean;
  glbMetadata: boolean;
  showTooltips: boolean;
  playDoom: boolean;
}

const initialState: SettingsState = {
  activeTilesOnScene: false,
  flyToTile: false,
  tileGridOnGlobe: false,
  glbTiles: false,
  glbMetadata: false,
  showTooltips: true,
  playDoom: false,
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setActiveTilesOnScene(state, action: PayloadAction<boolean>) {
      state.activeTilesOnScene = action.payload;

      if (!action.payload) {
        state.flyToTile = false;
      }
    },
    setFlyToTile(state, action: PayloadAction<boolean>) {
      state.flyToTile = action.payload;
    },
    setTileGridOnGlobe(state, action: PayloadAction<boolean>) {
      state.tileGridOnGlobe = action.payload;
    },
    setGlbTiles(state, action: PayloadAction<boolean>) {
      state.glbTiles = action.payload;

      if (!action.payload) {
        state.glbMetadata = false;
      }
    },
    setGlbMetadata(state, action: PayloadAction<boolean>) {
      state.glbMetadata = action.payload;
    },
    setShowTooltips(state, action: PayloadAction<boolean>) {
      state.showTooltips = action.payload;
    },
    setPlayDoom(state, action: PayloadAction<boolean>) {
      state.playDoom = action.payload;
    },
  },
  selectors: {
    selectSettings: (state) => state,
    selectActiveTilesOnScene: (state) => state.activeTilesOnScene,
    selectFlyToTile: (state) => state.flyToTile,
    selectTileGridOnGlobe: (state) => state.tileGridOnGlobe,
    selectGlbTiles: (state) => state.glbTiles,
    selectGlbMetadata: (state) => state.glbMetadata,
    selectShowTooltips: (state) => state.showTooltips,
    selectPlayDoom: (state) => state.playDoom,
  },
});

export const {
  setActiveTilesOnScene,
  setFlyToTile,
  setTileGridOnGlobe,
  setGlbTiles,
  setGlbMetadata,
  setShowTooltips,
  setPlayDoom,
} = settingsSlice.actions;

export const {
  selectSettings,
  selectActiveTilesOnScene,
  selectFlyToTile,
  selectTileGridOnGlobe,
  selectGlbTiles,
  selectGlbMetadata,
  selectShowTooltips,
  selectPlayDoom,
} = settingsSlice.selectors;
