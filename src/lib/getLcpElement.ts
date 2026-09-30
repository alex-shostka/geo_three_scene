import type { LCPMetric } from 'web-vitals';

export function getLcpElement(metric: LCPMetric): Element | null {
  const entry: LargestContentfulPaint | undefined = metric.entries[metric.entries.length - 1];

  return entry?.element ?? null;
}
