import { useEffect, useState } from 'react';
import { onCLS, onFCP, onINP, onLCP, onTTFB, type MetricType } from 'web-vitals';

export type WebVitalsState = {
  [Name in MetricType['name']]?: Extract<MetricType, { name: Name }>;
};

export function useWebVitals(): WebVitalsState {
  const [metrics, setMetrics] = useState<WebVitalsState>({});

  useEffect(() => {
    const record = (metric: MetricType) => {
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
