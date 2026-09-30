import { describe, expect, it } from 'vitest';
import { ANALYTICS_PANEL, MENU_PANEL, NETWORK_PANEL } from '../constants';
import type { TileCardSection } from '../types';
import { makeStore } from './index';
import { closeTileCard, openTileCard, selectIsPanelOpen, selectTileCard, togglePanel } from './uiSlice';

describe('ui', () => {
  it('opening one panel closes the other', () => {
    const store = makeStore();

    store.dispatch(togglePanel(MENU_PANEL));
    store.dispatch(togglePanel(ANALYTICS_PANEL));

    expect(selectIsPanelOpen(store.getState(), MENU_PANEL)).toBe(false);
    expect(selectIsPanelOpen(store.getState(), ANALYTICS_PANEL)).toBe(true);
  });

  it('toggling the open panel closes it', () => {
    const store = makeStore();

    store.dispatch(togglePanel(NETWORK_PANEL));
    store.dispatch(togglePanel(NETWORK_PANEL));

    expect(selectIsPanelOpen(store.getState(), NETWORK_PANEL)).toBe(false);
  });

  it('closing the tile card keeps its content', () => {
    const store = makeStore();
    const sections: TileCardSection[] = [{ rows: [['url', '/tiles_glb/10/1/1.glb']] }];

    store.dispatch(openTileCard({ title: '10 / 1 / 1', sections }));

    store.dispatch(closeTileCard());

    expect(selectTileCard(store.getState())).toEqual({ open: false, title: '10 / 1 / 1', sections });
  });
});
