import { describe, expect, it } from 'vitest';
import { BENCHMARK_STATUS } from '../constants';
import {
  benchmarkRunStarted,
  benchmarkStepFinished,
  initialLoadMeasured,
  runBenchmark,
  selectBenchmarkConditions,
  selectBenchmarkError,
  selectBenchmarkRuns,
  selectBenchmarkStatus,
  selectFinishedStepsCount,
  selectInitialLoad,
  selectRouteSummary,
  selectStepSummaries,
} from './benchmarkSlice';
import { makeStore } from './index';

const step = { step: 1, label: '50 km', height: 50_000, loadMs: 3400, afterArrivalMs: 400 };
const conditions = { width: 1600, height: 864, devicePixelRatio: 2, flightSeconds: 3, runs: 1 };
const started = runBenchmark.pending('req-1', conditions);
const failed = runBenchmark.rejected(new Error('Tiles did not finish loading within 60 s'), 'req-1', conditions);

describe('benchmark', () => {
  it('collects step results until the run finishes', () => {
    const store = makeStore();

    store.dispatch(started);
    store.dispatch(benchmarkRunStarted());
    store.dispatch(benchmarkStepFinished(step));

    expect(selectBenchmarkStatus(store.getState())).toBe(BENCHMARK_STATUS.RUNNING);

    store.dispatch(runBenchmark.fulfilled(undefined, 'req-1', conditions));

    expect(selectBenchmarkStatus(store.getState())).toBe(BENCHMARK_STATUS.DONE);
    expect(selectBenchmarkRuns(store.getState())).toEqual([[step]]);
  });

  it('a new run clears the previous results and error', () => {
    const store = makeStore();

    store.dispatch(started);
    store.dispatch(benchmarkRunStarted());
    store.dispatch(benchmarkStepFinished(step));
    store.dispatch(failed);
    store.dispatch(started);

    expect(selectBenchmarkRuns(store.getState())).toEqual([]);
    expect(selectBenchmarkError(store.getState())).toBeNull();
  });

  it('a failed run keeps the steps that finished', () => {
    const store = makeStore();

    store.dispatch(started);
    store.dispatch(benchmarkRunStarted());
    store.dispatch(benchmarkStepFinished(step));
    store.dispatch(failed);

    expect(selectBenchmarkStatus(store.getState())).toBe(BENCHMARK_STATUS.ERROR);
    expect(selectBenchmarkRuns(store.getState())).toEqual([[step]]);
  });

  it('a new run keeps the page-open measurement', () => {
    const store = makeStore();

    store.dispatch(initialLoadMeasured({ ms: 2100, tabWasHidden: false }));
    store.dispatch(started);

    expect(selectInitialLoad(store.getState())).toEqual({ ms: 2100, tabWasHidden: false });
  });

  it('remembers the conditions the run started with', () => {
    const store = makeStore();

    store.dispatch(started);

    expect(selectBenchmarkConditions(store.getState())).toEqual(conditions);
  });

  it('keeps every run separately', () => {
    const store = makeStore();
    const secondStep = { ...step, loadMs: 3100 };

    store.dispatch(runBenchmark.pending('req-1', { ...conditions, runs: 2 }));
    store.dispatch(benchmarkRunStarted());
    store.dispatch(benchmarkStepFinished(step));
    store.dispatch(benchmarkRunStarted());
    store.dispatch(benchmarkStepFinished(secondStep));

    expect(selectBenchmarkRuns(store.getState())).toEqual([[step], [secondStep]]);
  });

  it('a cancelled run keeps the steps that finished', async () => {
    const store = makeStore();
    const task = store.dispatch(runBenchmark(conditions));

    store.dispatch(benchmarkRunStarted());
    store.dispatch(benchmarkStepFinished(step));
    task.abort();
    await task;

    expect(selectBenchmarkStatus(store.getState())).toBe(BENCHMARK_STATUS.CANCELLED);
    expect(selectBenchmarkRuns(store.getState())).toEqual([[step]]);
    expect(selectBenchmarkError(store.getState())).toBeNull();
  });

  it('summarizes measured runs and memoizes the result', () => {
    const store = makeStore();
    const warmupStep = { ...step, loadMs: 5000 };
    const measuredStep = { ...step, loadMs: 3000 };

    store.dispatch(runBenchmark.pending('req-1', { ...conditions, runs: 2 }));
    store.dispatch(benchmarkRunStarted());
    store.dispatch(benchmarkStepFinished(warmupStep));
    store.dispatch(benchmarkRunStarted());
    store.dispatch(benchmarkStepFinished(measuredStep));

    const state = store.getState();

    expect(selectFinishedStepsCount(state)).toBe(2);
    expect(selectStepSummaries(state)).toEqual([
      {
        step: 1,
        label: '50 km',
        samples: 1,
        medianMs: 3000,
        p25Ms: 3000,
        p75Ms: 3000,
        minMs: 3000,
        maxMs: 3000,
        medianAfterArrivalMs: 400,
      },
    ]);
    expect(selectRouteSummary(state)).toEqual({
      samples: 1,
      medianMs: 3000,
      p25Ms: 3000,
      p75Ms: 3000,
    });
    expect(selectStepSummaries(state)).toBe(selectStepSummaries(state));
    expect(selectRouteSummary(state)).toBe(selectRouteSummary(state));
  });
});
