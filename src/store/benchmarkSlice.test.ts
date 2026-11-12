import { describe, expect, it } from 'vitest';
import { BENCHMARK_STATUS } from '../constants';
import {
  benchmarkCancelled,
  benchmarkFailed,
  benchmarkFinished,
  benchmarkRunStarted,
  benchmarkStarted,
  benchmarkStepFinished,
  initialLoadMeasured,
  selectBenchmarkConditions,
  selectBenchmarkError,
  selectBenchmarkRuns,
  selectBenchmarkStatus,
  selectInitialLoad,
} from './benchmarkSlice';
import { makeStore } from './index';

const step = { step: 1, label: '50 km', height: 50_000, loadMs: 3400, afterArrivalMs: 400 };
const conditions = { width: 1600, height: 864, devicePixelRatio: 2, flightSeconds: 3, runs: 1 };

describe('benchmark', () => {
  it('collects step results until the run finishes', () => {
    const store = makeStore();

    store.dispatch(benchmarkStarted(conditions));
    store.dispatch(benchmarkRunStarted());
    store.dispatch(benchmarkStepFinished(step));

    expect(selectBenchmarkStatus(store.getState())).toBe(BENCHMARK_STATUS.RUNNING);

    store.dispatch(benchmarkFinished());

    expect(selectBenchmarkStatus(store.getState())).toBe(BENCHMARK_STATUS.DONE);
    expect(selectBenchmarkRuns(store.getState())).toEqual([[step]]);
  });

  it('a new run clears the previous results and error', () => {
    const store = makeStore();

    store.dispatch(benchmarkStarted(conditions));
    store.dispatch(benchmarkRunStarted());
    store.dispatch(benchmarkStepFinished(step));
    store.dispatch(benchmarkFailed('Tiles did not finish loading within 60 s'));
    store.dispatch(benchmarkStarted(conditions));

    expect(selectBenchmarkRuns(store.getState())).toEqual([]);
    expect(selectBenchmarkError(store.getState())).toBeNull();
  });

  it('a failed run keeps the steps that finished', () => {
    const store = makeStore();

    store.dispatch(benchmarkStarted(conditions));
    store.dispatch(benchmarkRunStarted());
    store.dispatch(benchmarkStepFinished(step));
    store.dispatch(benchmarkFailed('Tiles did not finish loading within 60 s'));

    expect(selectBenchmarkStatus(store.getState())).toBe(BENCHMARK_STATUS.ERROR);
    expect(selectBenchmarkRuns(store.getState())).toEqual([[step]]);
  });

  it('a new run keeps the page-open measurement', () => {
    const store = makeStore();

    store.dispatch(initialLoadMeasured({ ms: 2100, tabWasHidden: false }));
    store.dispatch(benchmarkStarted(conditions));

    expect(selectInitialLoad(store.getState())).toEqual({ ms: 2100, tabWasHidden: false });
  });

  it('remembers the conditions the run started with', () => {
    const store = makeStore();

    store.dispatch(benchmarkStarted(conditions));

    expect(selectBenchmarkConditions(store.getState())).toEqual(conditions);
  });

  it('keeps every run separately', () => {
    const store = makeStore();
    const secondStep = { ...step, loadMs: 3100 };

    store.dispatch(benchmarkStarted({ ...conditions, runs: 2 }));
    store.dispatch(benchmarkRunStarted());
    store.dispatch(benchmarkStepFinished(step));
    store.dispatch(benchmarkRunStarted());
    store.dispatch(benchmarkStepFinished(secondStep));

    expect(selectBenchmarkRuns(store.getState())).toEqual([[step], [secondStep]]);
  });

  it('a cancelled run keeps the steps that finished', () => {
    const store = makeStore();

    store.dispatch(benchmarkStarted(conditions));
    store.dispatch(benchmarkRunStarted());
    store.dispatch(benchmarkStepFinished(step));
    store.dispatch(benchmarkCancelled());

    expect(selectBenchmarkStatus(store.getState())).toBe(BENCHMARK_STATUS.CANCELLED);
    expect(selectBenchmarkRuns(store.getState())).toEqual([[step]]);
    expect(selectBenchmarkError(store.getState())).toBeNull();
  });
});
