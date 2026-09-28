import { describe, expect, it } from 'vitest';
import { makeStore } from './index';
import {
  selectFlyToTile, selectGlbMetadata,
  setActiveTilesOnScene, setFlyToTile, setGlbMetadata, setGlbTiles,
} from './settingsSlice';

describe('settings', () => {
  it('turning off active tiles resets fly-to-tile', () => {
    const store = makeStore();
    store.dispatch(setActiveTilesOnScene(true));
    store.dispatch(setFlyToTile(true));

    store.dispatch(setActiveTilesOnScene(false));

    expect(selectFlyToTile(store.getState())).toBe(false);
  });

  it('turning off GLB tiles resets GLB metadata', () => {
    const store = makeStore();
    store.dispatch(setGlbTiles(true));
    store.dispatch(setGlbMetadata(true));

    store.dispatch(setGlbTiles(false));

    expect(selectGlbMetadata(store.getState())).toBe(false);
  });
});
