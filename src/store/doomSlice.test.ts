import { describe, expect, it } from 'vitest';
import { DOOM_PHASE } from '../constants';
import { selectDoomStatus, setDoomStatus } from './doomSlice';
import { makeStore } from './index';
import { setPlayDoom } from './settingsSlice';

describe('doom', () => {
  it('starts idle', () => {
    const store = makeStore();

    expect(selectDoomStatus(store.getState())).toEqual({ phase: DOOM_PHASE.IDLE, progress: null });
  });

  it('stores the loading status', () => {
    const store = makeStore();

    store.dispatch(setDoomStatus({ phase: DOOM_PHASE.DOWNLOADING, progress: 42 }));

    expect(selectDoomStatus(store.getState())).toEqual({ phase: DOOM_PHASE.DOWNLOADING, progress: 42 });
  });

  it('turning DOOM off resets the status', () => {
    const store = makeStore();

    store.dispatch(setPlayDoom(true));
    store.dispatch(setDoomStatus({ phase: DOOM_PHASE.ERROR, progress: null }));
    store.dispatch(setPlayDoom(false));

    expect(selectDoomStatus(store.getState())).toEqual({ phase: DOOM_PHASE.IDLE, progress: null });
  });
});
