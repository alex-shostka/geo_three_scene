import { createEntityAdapter, createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { ACTIVE_TILE, ERROR_TILE } from '../constants';
import type { ActiveTileRecord, FocusBounds, HoveredTile, TileRecord } from '../types';
import { setActiveTilesOnScene } from './settingsSlice';

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

const countErrorTiles = createSelector(
  [adapterSelectors.selectAll],
  (tiles) => tiles.filter((tile) => tile.type === ERROR_TILE).length,
);

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
      loaded: 0,
      errors: 0,
      west: Infinity,
      east: -Infinity,
      south: Infinity,
      north: -Infinity,
    };

    if (tile.type === ACTIVE_TILE) {
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
    replaceActiveTiles(state, action: PayloadAction<ActiveTileRecord[]>) {
      const nextKeys = new Set(action.payload.map((tile) => tile.key));
      const staleKeys = state.ids.filter((key) => state.entities[key].type === ACTIVE_TILE && !nextKeys.has(key));

      tilesAdapter.removeMany(state, staleKeys);
      tilesAdapter.addMany(state, action.payload);

      if (state.hoveredTile?.type === ACTIVE_TILE && !nextKeys.has(state.hoveredTile.key)) {
        state.hoveredTile = null;
      }
    },

    setHoveredTile(state, action: PayloadAction<HoveredTile | null>) {
      state.hoveredTile = action.payload;
    },
    setFocusBounds(state, action: PayloadAction<FocusBounds | null>) {
      state.focusBounds = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(setActiveTilesOnScene, (state, action) => {
      if (!action.payload && state.hoveredTile?.type === ACTIVE_TILE) {
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
      adapterSelectors.selectAll(state).find((tile) => tile.type === ACTIVE_TILE),
    selectErrorCount: countErrorTiles,
    selectLevelCounts: countTilesByLevel,
    selectLevelStats: computeLevelStats,
  },
});

export const { addErrorTile, replaceActiveTiles, setHoveredTile, setFocusBounds } = tilesSlice.actions;

export const {
  selectAllTiles,
  selectTileById,
  selectHoveredTile,
  selectFocusBounds,
  selectIsTileHovered,
  selectHoveredRecord,
  selectFirstActiveTile,
  selectErrorCount,
  selectLevelCounts,
  selectLevelStats,
} = tilesSlice.selectors;
