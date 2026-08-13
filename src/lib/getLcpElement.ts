import type { Metric } from 'web-vitals';

export function getLcpElement(metric: Metric): Element | null {
  const entry = metric.entries[metric.entries.length - 1] as (PerformanceEntry & { element?: Element }) | undefined;
  return entry?.element ?? null;
}
