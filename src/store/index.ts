import { combineSlices, configureStore } from "@reduxjs/toolkit";
import { settingsSlice } from "./settingsSlice";

const rootReducer = combineSlices(settingsSlice);

export type RootState = ReturnType<typeof rootReducer>;

export function makeStore(preloadedState?: Partial<RootState>) {
    return configureStore({
        reducer: rootReducer,
        preloadedState,
    });
}

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];