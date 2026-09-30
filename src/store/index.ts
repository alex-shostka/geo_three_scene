import { combineSlices, configureStore } from '@reduxjs/toolkit';
import { settingsSlice } from './settingsSlice';
import { uiSlice } from './uiSlice';
import { tilesSlice } from './tilesSlice';

const rootReducer = combineSlices(settingsSlice, uiSlice, tilesSlice);

export type RootState = ReturnType<typeof rootReducer>;

export function makeStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
