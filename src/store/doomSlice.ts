import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { DOOM_PHASE } from '../constants';
import type { DoomStatus } from '../types';
import { setPlayDoom } from './settingsSlice';

const initialState: DoomStatus = {
  phase: DOOM_PHASE.IDLE,
  progress: null,
};

export const doomSlice = createSlice({
  name: 'doom',
  initialState,
  reducers: {
    setDoomStatus(state, action: PayloadAction<DoomStatus>) {
      state.phase = action.payload.phase;
      state.progress = action.payload.progress;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(setPlayDoom, (state, action) => {
      if (!action.payload) {
        state.phase = DOOM_PHASE.IDLE;
        state.progress = null;
      }
    });
  },
  selectors: {
    selectDoomStatus: (state) => state,
  },
});

export const { setDoomStatus } = doomSlice.actions;

export const { selectDoomStatus } = doomSlice.selectors;
