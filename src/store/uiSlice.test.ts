import { describe, expect, it } from 'vitest';
import { makeStore } from './index';
import type { TileCardSection } from '../types';
import { closeTileCard, openTileCard, selectIsPanelOpen, selectTileCard, togglePanel } from './uiSlice';

describe('ui', () => {
  it('opening one panel closes the other', () => {
    const store = makeStore();

    store.dispatch(togglePanel('menu'));
    store.dispatch(togglePanel('analytics'));

    expect(selectIsPanelOpen(store.getState(), 'menu')).toBe(false);
    expect(selectIsPanelOpen(store.getState(), 'analytics')).toBe(true);
  });

  it('toggling the open panel closes it', () => {
    const store = makeStore();

    store.dispatch(togglePanel('network'));
    store.dispatch(togglePanel('network'));

    expect(selectIsPanelOpen(store.getState(), 'network')).toBe(false);
  });

  it('closing the tile card keeps its content', () => {
    const store = makeStore();
    const sections: TileCardSection[] = [{ rows: [['url', '/tiles_glb/10/1/1.glb']] }];

    store.dispatch(openTileCard({ title: '10 / 1 / 1', sections }));

    store.dispatch(closeTileCard());

    expect(selectTileCard(store.getState())).toEqual({ open: false, title: '10 / 1 / 1', sections });
  });
});
