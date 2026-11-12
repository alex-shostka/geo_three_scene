import type { LoadStepResult } from '../../store/benchmarkSlice';

export interface StepSummary {
  step: number;
  label: string;
  samples: number;
  medianMs: number;
  p25Ms: number;
  p75Ms: number;
  minMs: number;
  maxMs: number;
  medianAfterArrivalMs: number;
}

export function quantile(values: number[], q: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * q;
  const lower = sorted[Math.floor(position)] ?? 0;
  const upper = sorted[Math.ceil(position)] ?? lower;

  return lower + (upper - lower) * (position - Math.floor(position));
}

export function warmupRunsFor(runCount: number): number {
  return runCount > 1 ? 1 : 0;
}

export function summarizeRuns(runs: LoadStepResult[][], warmupRuns: number): StepSummary[] {
  const measuredRuns = runs.slice(warmupRuns).filter((run) => run.length > 0);

  if (measuredRuns.length === 0) {
    return [];
  }

  const stepCount = Math.max(...measuredRuns.map((run) => run.length));
  const summaries: StepSummary[] = [];

  for (let index = 0; index < stepCount; index++) {
    const steps = measuredRuns.flatMap((run) => run[index] ?? []);
    const [first] = steps;

    if (!first) {
      continue;
    }

    const times = steps.map((result) => result.loadMs);

    summaries.push({
      step: first.step,
      label: first.label,
      samples: steps.length,
      medianMs: quantile(times, 0.5),
      p25Ms: quantile(times, 0.25),
      p75Ms: quantile(times, 0.75),
      minMs: Math.min(...times),
      maxMs: Math.max(...times),
      medianAfterArrivalMs: quantile(
        steps.map((result) => result.afterArrivalMs),
        0.5,
      ),
    });
  }

  return summaries;
}

export interface RouteSummary {
  samples: number;
  medianMs: number;
  p25Ms: number;
  p75Ms: number;
}

export function summarizeRoute(runs: LoadStepResult[][], warmupRuns: number, stepCount: number): RouteSummary | null {
  const totals = runs
    .slice(warmupRuns)
    .filter((run) => run.length === stepCount)
    .map((run) => run.reduce((total, result) => total + result.loadMs, 0));

  if (totals.length === 0) {
    return null;
  }

  return {
    samples: totals.length,
    medianMs: quantile(totals, 0.5),
    p25Ms: quantile(totals, 0.25),
    p75Ms: quantile(totals, 0.75),
  };
}
