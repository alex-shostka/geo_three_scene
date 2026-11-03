import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { BENCHMARK_STATUS } from '../constants';

export interface LoadStepResult {
  step: number;
  label: string;
  height: number;
  loadMs: number;
  afterArrivalMs: number;
}

export interface RunConditions {
  width: number;
  height: number;
  devicePixelRatio: number;
  flightSeconds: number;
}

export interface InitialLoad {
  ms: number;
  tabWasHidden: boolean;
}

type BenchmarkStatus = (typeof BENCHMARK_STATUS)[keyof typeof BENCHMARK_STATUS];

interface BenchmarkState {
  status: BenchmarkStatus;
  initialLoad: InitialLoad | null;
  conditions: RunConditions | null;
  results: LoadStepResult[];
  error: string | null;
}

const initialState: BenchmarkState = {
  status: BENCHMARK_STATUS.IDLE,
  initialLoad: null,
  conditions: null,
  results: [],
  error: null,
};

export const benchmarkSlice = createSlice({
  name: 'benchmark',
  initialState,
  reducers: {
    initialLoadMeasured(state, action: PayloadAction<InitialLoad>) {
      state.initialLoad = action.payload;
    },
    benchmarkStarted(state, action: PayloadAction<RunConditions>) {
      state.status = BENCHMARK_STATUS.RUNNING;
      state.conditions = action.payload;
      state.results = [];
      state.error = null;
    },
    benchmarkStepFinished(state, action: PayloadAction<LoadStepResult>) {
      state.results.push(action.payload);
    },
    benchmarkFinished(state) {
      state.status = BENCHMARK_STATUS.DONE;
    },
    benchmarkCancelled(state) {
      state.status = BENCHMARK_STATUS.CANCELLED;
    },
    benchmarkFailed(state, action: PayloadAction<string>) {
      state.status = BENCHMARK_STATUS.ERROR;
      state.error = action.payload;
    },
  },
  selectors: {
    selectBenchmarkStatus: (state) => state.status,
    selectInitialLoad: (state) => state.initialLoad,
    selectBenchmarkConditions: (state) => state.conditions,
    selectBenchmarkResults: (state) => state.results,
    selectBenchmarkError: (state) => state.error,
  },
});

export const {
  initialLoadMeasured,
  benchmarkStarted,
  benchmarkStepFinished,
  benchmarkFinished,
  benchmarkCancelled,
  benchmarkFailed,
} = benchmarkSlice.actions;
export const {
  selectBenchmarkStatus,
  selectInitialLoad,
  selectBenchmarkConditions,
  selectBenchmarkResults,
  selectBenchmarkError,
} = benchmarkSlice.selectors;
