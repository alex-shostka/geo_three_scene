import { describe, expect, it } from 'vitest';
import type { LoadStepResult } from '../../store/benchmarkSlice';
import { quantile, summarizeRoute, summarizeRuns, warmupRunsFor } from './summarizeRuns';

function run(...times: number[]): LoadStepResult[] {
  return times.map((loadMs, index) => ({
    step: index + 1,
    label: `step ${index + 1}`,
    height: 1000,
    loadMs,
    afterArrivalMs: loadMs / 10,
  }));
}

describe('quantile', () => {
  it('takes the middle value of an odd set', () => {
    expect(quantile([5, 1, 3], 0.5)).toBe(3);
  });

  it('interpolates between the two middle values of an even set', () => {
    expect(quantile([1, 2, 3, 4], 0.5)).toBe(2.5);
    expect(quantile([1, 2, 3, 4], 0.25)).toBe(1.75);
  });
});

describe('warmupRunsFor', () => {
  it('keeps a single run and drops the first of several', () => {
    expect(warmupRunsFor(1)).toBe(0);
    expect(warmupRunsFor(5)).toBe(1);
  });
});

describe('summarizeRuns', () => {
  it('uses a single run as it is', () => {
    const [summary] = summarizeRuns([run(400)], 0);

    expect(summary).toMatchObject({ samples: 1, medianMs: 400, minMs: 400, maxMs: 400 });
  });

  it('drops the warm-up run and takes the median per step', () => {
    const summaries = summarizeRuns([run(9000, 900), run(100, 10), run(300, 30), run(200, 20)], 1);

    expect(summaries.map((summary) => summary.medianMs)).toEqual([200, 20]);
    expect(summaries[0]).toMatchObject({ samples: 3, minMs: 100, maxMs: 300, medianAfterArrivalMs: 20 });
  });

  it('counts each step over the runs that reached it', () => {
    const summaries = summarizeRuns([run(1, 1), run(100, 10), run(300)], 1);

    expect(summaries.map((summary) => summary.samples)).toEqual([2, 1]);
  });

  it('is empty until a measured run has a step', () => {
    expect(summarizeRuns([run(100), []], 1)).toEqual([]);
  });
});

describe('summarizeRoute', () => {
  it('takes the median of full-route times, not the sum of step medians', () => {
    const route = summarizeRoute([run(9000, 9000), run(100, 500), run(500, 100), run(300, 300)], 1, 2);

    expect(route).toMatchObject({ samples: 3, medianMs: 600 });
  });

  it('skips runs that did not finish the route', () => {
    expect(summarizeRoute([run(100), run(100, 200), run(300)], 1, 2)).toMatchObject({ samples: 1, medianMs: 300 });
    expect(summarizeRoute([run(100, 200), run(300)], 1, 2)).toBeNull();
  });
});
