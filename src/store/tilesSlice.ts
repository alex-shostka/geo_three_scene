import { createEntityAdapter, createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { setActiveTilesOnScene } from './settingsSlice';
import type { FocusBounds, HoveredTile, TileRecord } from '../types';

const tilesAdapter = createEntityAdapter({
  selectId: (tile: TileRecord) => tile.key,
});

const adapterSelectors = tilesAdapter.getSelectors();

const initialState = tilesAdapter.getInitialState<{
  hoveredTile: HoveredTile | null;
  focusBounds: FocusBounds | null;
}>({
  hoveredTile: null,
  focusBounds: null,
});

type TilesState = typeof initialState;

export interface LevelStats {
  level: number;
  loaded: number;
  errors: number;
  west: number;
  east: number;
  south: number;
  north: number;
}

const countErrorTiles = createSelector([adapterSelectors.selectAll], (tiles) =>
  tiles.filter((tile) => tile.type === 'error').length);

const countTilesByLevel = createSelector([adapterSelectors.selectAll], (tiles) => {
  const counts = new Map<number, number>();

  tiles.forEach((tile) => counts.set(tile.level, (counts.get(tile.level) ?? 0) + 1));

  return Array.from(counts.entries())
    .sort(([a], [b]) => a - b)
    .map(([level, count]) => ({ level, count }));
});

const computeLevelStats = createSelector([adapterSelectors.selectAll], (tiles): LevelStats[] => {
  const stats = new Map<number, Omit<LevelStats, 'level'>>();

  tiles.forEach((tile) => {
    const entry = stats.get(tile.level) ?? {
      loaded: 0, errors: 0,
      west: Infinity, east: -Infinity, south: Infinity, north: -Infinity,
    };

    if (tile.type === 'active') {
      entry.loaded += 1;
    } else {
      entry.errors += 1;
    }

    entry.west = Math.min(entry.west, tile.west);
    entry.east = Math.max(entry.east, tile.east);
    entry.south = Math.min(entry.south, tile.south);
    entry.north = Math.max(entry.north, tile.north);
    stats.set(tile.level, entry);
  });

  return Array.from(stats.entries())
    .sort(([a], [b]) => a - b)
    .map(([level, entry]) => ({ level, ...entry }));
});

export const tilesSlice = createSlice({
  name: 'tiles',
  initialState,
  reducers: {
    addErrorTile: tilesAdapter.addOne,
    addActiveTiles: tilesAdapter.addMany,
    setHoveredTile(state, action: PayloadAction<HoveredTile | null>) {
      state.hoveredTile = action.payload;
    },
    setFocusBounds(state, action: PayloadAction<FocusBounds | null>) {
      state.focusBounds = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(setActiveTilesOnScene, (state, action) => {
      if (!action.payload && state.hoveredTile?.type === 'active') {
        state.hoveredTile = null;
      }
    });
  },
  selectors: {
    selectAllTiles: adapterSelectors.selectAll,
    selectTileById: adapterSelectors.selectById,
    selectHoveredTile: (state) => state.hoveredTile,
    selectFocusBounds: (state) => state.focusBounds,
    selectIsTileHovered: (state, type: TileRecord['type'], key: string) =>
      state.hoveredTile?.type === type && state.hoveredTile.key === key,
    selectHoveredRecord: (state: TilesState) =>
      state.hoveredTile ? adapterSelectors.selectById(state, state.hoveredTile.key) : undefined,
    selectFirstActiveTile: (state: TilesState) =>
      adapterSelectors.selectAll(state).find((tile) => tile.type === 'active'),
    selectErrorCount: countErrorTiles,
    selectLevelCounts: countTilesByLevel,
    selectLevelStats: computeLevelStats,
  },
});

export const { addErrorTile, addActiveTiles, setHoveredTile, setFocusBounds } = tilesSlice.actions;

export const {
  selectAllTiles, selectTileById, selectHoveredTile, selectFocusBounds, selectIsTileHovered,
  selectHoveredRecord, selectFirstActiveTile, selectErrorCount, selectLevelCounts, selectLevelStats,
} = tilesSlice.selectors;
