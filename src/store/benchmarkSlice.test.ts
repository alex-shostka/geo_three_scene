import { describe, expect, it } from 'vitest';
import { BENCHMARK_STATUS } from '../constants';
import {
  benchmarkFailed,
  benchmarkFinished,
  benchmarkStarted,
  benchmarkStepFinished,
  initialLoadMeasured,
  selectBenchmarkError,
  selectBenchmarkResults,
  selectBenchmarkStatus,
  selectInitialLoad,
} from './benchmarkSlice';
import { makeStore } from './index';

const step = { label: '5 km', height: 5_000, loadMs: 1234 };

describe('benchmark', () => {
  it('collects step results until the run finishes', () => {
    const store = makeStore();

    store.dispatch(benchmarkStarted());
    store.dispatch(benchmarkStepFinished(step));

    expect(selectBenchmarkStatus(store.getState())).toBe(BENCHMARK_STATUS.RUNNING);

    store.dispatch(benchmarkFinished());

    expect(selectBenchmarkStatus(store.getState())).toBe(BENCHMARK_STATUS.DONE);
    expect(selectBenchmarkResults(store.getState())).toEqual([step]);
  });

  it('a new run clears the previous results and error', () => {
    const store = makeStore();

    store.dispatch(benchmarkStarted());
    store.dispatch(benchmarkStepFinished(step));
    store.dispatch(benchmarkFailed('Tiles did not finish loading within 60 s'));
    store.dispatch(benchmarkStarted());

    expect(selectBenchmarkResults(store.getState())).toEqual([]);
    expect(selectBenchmarkError(store.getState())).toBeNull();
  });

  it('a failed run keeps the steps that finished', () => {
    const store = makeStore();

    store.dispatch(benchmarkStarted());
    store.dispatch(benchmarkStepFinished(step));
    store.dispatch(benchmarkFailed('Tiles did not finish loading within 60 s'));

    expect(selectBenchmarkStatus(store.getState())).toBe(BENCHMARK_STATUS.ERROR);
    expect(selectBenchmarkResults(store.getState())).toEqual([step]);
  });

  it('a new run keeps the page-open measurement', () => {
    const store = makeStore();

    store.dispatch(initialLoadMeasured({ ms: 2100, tabWasHidden: false }));
    store.dispatch(benchmarkStarted());

    expect(selectInitialLoad(store.getState())).toEqual({ ms: 2100, tabWasHidden: false });
  });
});
