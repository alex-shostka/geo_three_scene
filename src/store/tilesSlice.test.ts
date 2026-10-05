import { describe, expect, it } from 'vitest';
import type { ActiveTileRecord, ErrorTileRecord } from '../types';
import { makeStore } from './index';
import { setActiveTilesOnScene } from './settingsSlice';
import {
  addErrorTile,
  replaceActiveTiles,
  selectAllTiles,
  selectErrorCount,
  selectHoveredTile,
  selectLevelCounts,
  selectLevelStats,
  setHoveredTile,
} from './tilesSlice';

const bounds = { west: 0, east: 1, south: 0, north: 1 };

const errorTile = (key: string, level = 10): ErrorTileRecord => ({
  type: 'error',
  key,
  level,
  x: 1,
  y: 1,
  ...bounds,
  tileUrl: '/tiles/10/1/1.png',
  errorMsg: '404',
});

const activeTile = (key: string, level = 10): ActiveTileRecord => ({
  type: 'active',
  key,
  level,
  x: 1,
  y: 1,
  ...bounds,
  baseColor: 0xffffff,
});

describe('tiles', () => {
  it('replaces active tiles with the current view', () => {
    const store = makeStore();

    store.dispatch(replaceActiveTiles([activeTile('10/1/1'), activeTile('10/1/2')]));
    store.dispatch(replaceActiveTiles([activeTile('10/1/2'), activeTile('10/1/3')]));

    expect(selectAllTiles(store.getState()).map((tile) => tile.key)).toEqual(['10/1/2', '10/1/3']);
  });

  it('keeps error tiles when active tiles are replaced', () => {
    const store = makeStore();

    store.dispatch(addErrorTile(errorTile('err:10/1/1')));
    store.dispatch(replaceActiveTiles([activeTile('10/1/1')]));
    store.dispatch(replaceActiveTiles([]));

    expect(selectAllTiles(store.getState()).map((tile) => tile.key)).toEqual(['err:10/1/1']);
  });

  it('clears hover when the hovered active tile leaves the view', () => {
    const store = makeStore();

    store.dispatch(replaceActiveTiles([activeTile('10/1/1')]));
    store.dispatch(setHoveredTile({ type: 'active', key: '10/1/1' }));
    store.dispatch(replaceActiveTiles([activeTile('10/1/2')]));

    expect(selectHoveredTile(store.getState())).toBeNull();
  });

  it('keeps state identity when nothing new is added', () => {
    const store = makeStore();

    store.dispatch(replaceActiveTiles([activeTile('10/1/1')]));

    const before = store.getState().tiles;

    store.dispatch(replaceActiveTiles([activeTile('10/1/1')]));

    expect(store.getState().tiles).toBe(before);
  });

  it('counts error tiles', () => {
    const store = makeStore();

    store.dispatch(addErrorTile(errorTile('err:10/1/1')));
    store.dispatch(replaceActiveTiles([activeTile('10/1/1')]));

    expect(selectErrorCount(store.getState())).toBe(1);
  });

  it('counts tiles per level, sorted by level', () => {
    const store = makeStore();

    store.dispatch(replaceActiveTiles([activeTile('12/1/1', 12), activeTile('10/1/1', 10), activeTile('12/1/2', 12)]));

    expect(selectLevelCounts(store.getState())).toEqual([
      { level: 10, count: 1 },
      { level: 12, count: 2 },
    ]);
  });

  it('computes per-level stats with counts and extent', () => {
    const store = makeStore();

    store.dispatch(
      replaceActiveTiles([
        { ...activeTile('10/1/1'), west: 0, east: 1, south: 0, north: 1 },
        { ...activeTile('10/2/1'), west: 1, east: 2, south: 0, north: 1 },
        activeTile('12/1/1', 12),
      ]),
    );
    store.dispatch(addErrorTile({ ...errorTile('err:10/1/2'), west: 0, east: 1, south: -1, north: 0 }));

    expect(selectLevelStats(store.getState())).toEqual([
      { level: 10, loaded: 2, errors: 1, west: 0, east: 2, south: -1, north: 1 },
      { level: 12, loaded: 1, errors: 0, west: 0, east: 1, south: 0, north: 1 },
    ]);
  });

  it('returns the same stats array while tiles are unchanged', () => {
    const store = makeStore();

    store.dispatch(replaceActiveTiles([activeTile('10/1/1')]));

    expect(selectLevelStats(store.getState())).toBe(selectLevelStats(store.getState()));
  });

  it('clears active hover when active tiles are turned off', () => {
    const store = makeStore();

    store.dispatch(setActiveTilesOnScene(true));
    store.dispatch(setHoveredTile({ type: 'active', key: '10/1/1' }));

    store.dispatch(setActiveTilesOnScene(false));

    expect(selectHoveredTile(store.getState())).toBeNull();
  });

  it('keeps error hover when active tiles are turned off', () => {
    const store = makeStore();

    store.dispatch(setHoveredTile({ type: 'error', key: 'err:10/1/1' }));

    store.dispatch(setActiveTilesOnScene(false));

    expect(selectHoveredTile(store.getState())).toEqual({ type: 'error', key: 'err:10/1/1' });
  });
});
