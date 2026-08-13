import type { Metric } from 'web-vitals';

export function formatWebVitalValue(metric: Metric): string {
  if (metric.name === 'CLS') {
    return metric.value.toFixed(3);
  }
  
  return `${Math.round(metric.value)} ms`;
}
