import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { BENCHMARK_STATUS } from '../constants';
import { summarizeRoute, summarizeRuns, warmupRunsFor, type LoadStepResult } from '../lib/benchmark/summarizeRuns';

export interface RunConditions {
  width: number;
  height: number;
  devicePixelRatio: number;
  flightSeconds: number;
  runs: number;
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
  runs: LoadStepResult[][];
  error: string | null;
}

const initialState: BenchmarkState = {
  status: BENCHMARK_STATUS.IDLE,
  initialLoad: null,
  conditions: null,
  runs: [],
  error: null,
};

const selectRuns = (state: BenchmarkState) => state.runs;
const selectWarmupRuns = (state: BenchmarkState) => (state.conditions ? warmupRunsFor(state.conditions.runs) : 0);

const computeStepSummaries = createSelector([selectRuns, selectWarmupRuns], (runs, warmupRuns) =>
  summarizeRuns(runs, warmupRuns),
);

const computeRouteSummary = createSelector(
  [selectRuns, selectWarmupRuns, computeStepSummaries],
  (runs, warmupRuns, summaries) => summarizeRoute(runs, warmupRuns, summaries.length),
);
const countFinishedSteps = createSelector([selectRuns], (runs) => runs.reduce((total, run) => total + run.length, 0));

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
      state.runs = [];
      state.error = null;
    },
    benchmarkRunStarted(state) {
      state.runs.push([]);
    },
    benchmarkStepFinished(state, action: PayloadAction<LoadStepResult>) {
      state.runs[state.runs.length - 1]?.push(action.payload);
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
    selectBenchmarkRuns: (state) => state.runs,
    selectBenchmarkError: (state) => state.error,
    selectStepSummaries: computeStepSummaries,
    selectRouteSummary: computeRouteSummary,
    selectFinishedStepsCount: countFinishedSteps,
  },
});

export const {
  initialLoadMeasured,
  benchmarkStarted,
  benchmarkRunStarted,
  benchmarkStepFinished,
  benchmarkFinished,
  benchmarkCancelled,
  benchmarkFailed,
} = benchmarkSlice.actions;
export const {
  selectBenchmarkStatus,
  selectInitialLoad,
  selectBenchmarkConditions,
  selectBenchmarkRuns,
  selectBenchmarkError,
  selectStepSummaries,
  selectRouteSummary,
  selectFinishedStepsCount,
} = benchmarkSlice.selectors;
