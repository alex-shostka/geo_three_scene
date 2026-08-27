import { useEffect, useState } from 'react';
import { onCLS, onINP, onLCP, type Metric } from 'web-vitals';
// import { onFCP, onTTFB } from 'web-vitals';

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
    // onFCP(record);
    // onTTFB(record);
  }, []);

  return metrics;
}
