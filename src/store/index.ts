import { combineSlices, configureStore } from '@reduxjs/toolkit';
import { doomSlice } from './doomSlice';
import { settingsSlice } from './settingsSlice';
import { tilesSlice } from './tilesSlice';
import { uiSlice } from './uiSlice';

const rootReducer = combineSlices(settingsSlice, uiSlice, tilesSlice, doomSlice);

export type RootState = ReturnType<typeof rootReducer>;

export function makeStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
