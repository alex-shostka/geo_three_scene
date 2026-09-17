import { useEffect, useState } from 'react';
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

export type WebVitalsState = Partial<Record<Metric['name'], Metric>>;

export function useWebVitals(): WebVitalsState {
  const [metrics, setMetrics] = useState<WebVitalsState>({});

  useEffect(() => {
    const record = (metric: Metric) => {
      setMetrics((prev) => ({ ...prev, [metric.name]: metric }));
    };
    onCLS(record, { reportAllChanges: true });
    onINP(record, { reportAllChanges: true });
    onLCP(record, { reportAllChanges: true });
    onTTFB(record, { reportAllChanges: true });
    onFCP(record, { reportAllChanges: true });
  }, []);

  return metrics;
}
