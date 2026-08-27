import type { Metric } from 'web-vitals';

export function getInpElement(metric: Metric): Element | null {
  let worst: (PerformanceEntry & { target?: Node | null; duration: number }) | undefined;

  for (const entry of metric.entries as (PerformanceEntry & { target?: Node | null; duration: number })[]) {
    if (!worst || entry.duration > worst.duration) worst = entry;
  }

  return worst?.target instanceof Element ? worst.target : null;
}
