import type { INPMetric } from 'web-vitals';

export function getInpElement(metric: INPMetric): Element | null {
  let worst: PerformanceEventTiming | undefined;

  for (const entry of metric.entries) {
    if (!worst || entry.duration > worst.duration) {
      worst = entry;
    }
  }

  return worst?.target instanceof Element ? worst.target : null;
}
