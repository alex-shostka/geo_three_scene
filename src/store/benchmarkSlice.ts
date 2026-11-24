import { createAsyncThunk, createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { getViewer } from '../cesium/viewerStore';
import { BENCHMARK_STATUS } from '../constants';
import { summarizeRoute, summarizeRuns, warmupRunsFor, type LoadStepResult } from '../lib/benchmark/summarizeRuns';

export interface RunConditions {
  width: number;
  height: number;
  devicePixelRatio: number;
  flightSeconds: number;
  maximumScreenSpaceError: number;
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

export const runBenchmark = createAsyncThunk<void, RunConditions>(
  'benchmark/run',
  async (conditions, { dispatch, signal }) => {
    const { runLoadBenchmark } = await import('../lib/benchmark/runLoadBenchmark');
    const viewer = getViewer();

    if (!viewer) {
      throw new Error('Viewer is not ready');
    }

    await runLoadBenchmark(viewer, {
      runs: conditions.runs,
      flightSeconds: conditions.flightSeconds,
      signal,
      onRunStart: () => dispatch(benchmarkRunStarted()),
      onStep: (result) => dispatch(benchmarkStepFinished(result)),
    });
  },
);

export const benchmarkSlice = createSlice({
  name: 'benchmark',
  initialState,
  reducers: {
    initialLoadMeasured(state, action: PayloadAction<InitialLoad>) {
      state.initialLoad = action.payload;
    },
    benchmarkRunStarted(state) {
      state.runs.push([]);
    },
    benchmarkStepFinished(state, action: PayloadAction<LoadStepResult>) {
      state.runs[state.runs.length - 1]?.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(runBenchmark.pending, (state, action) => {
        state.status = BENCHMARK_STATUS.RUNNING;
        state.conditions = action.meta.arg;
        state.runs = [];
        state.error = null;
      })
      .addCase(runBenchmark.fulfilled, (state) => {
        state.status = BENCHMARK_STATUS.DONE;
      })
      .addCase(runBenchmark.rejected, (state, action) => {
        if (action.meta.aborted) {
          state.status = BENCHMARK_STATUS.CANCELLED;

          return;
        }

        state.status = BENCHMARK_STATUS.ERROR;
        state.error = action.error.message ?? 'Benchmark failed';
      });
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
    selectLastOverlay: (state) => {
      const lastRun = state.runs[state.runs.length - 1];

      return lastRun?.[lastRun.length - 1]?.frame.overlay ?? null;
    },
  },
});

export const { initialLoadMeasured, benchmarkRunStarted, benchmarkStepFinished } = benchmarkSlice.actions;
export const {
  selectBenchmarkStatus,
  selectInitialLoad,
  selectBenchmarkConditions,
  selectBenchmarkRuns,
  selectBenchmarkError,
  selectStepSummaries,
  selectRouteSummary,
  selectFinishedStepsCount,
  selectLastOverlay,
} = benchmarkSlice.selectors;
