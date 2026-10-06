import type { MetricType } from 'web-vitals';
import { NETWORK_PANEL } from '../constants';
import { useWebVitals } from '../hooks/useWebVitals';
import { formatWebVitalValue } from '../lib/formatWebVitalValue';
import { getClsElement } from '../lib/getClsElement';
import { getInpElement } from '../lib/getInpElement';
import { getLcpElement } from '../lib/getLcpElement';
import { highlightElement } from '../lib/highlightElement';
import { panelElementId } from '../lib/panelElementId';
import { useAppSelector } from '../store/hooks';
import { selectIsPanelOpen } from '../store/uiSlice';
import { Panel } from './ui/Panel';
import { StatsTable } from './ui/StatsTable';

const WEB_VITALS_ORDER: MetricType['name'][] = ['FCP', 'LCP', 'INP', 'CLS', 'TTFB'];

export function NetworkPanel() {
  const networkOpen = useAppSelector((s) => selectIsPanelOpen(s, NETWORK_PANEL));
  const webVitals = useWebVitals();
  const metrics = WEB_VITALS_ORDER.flatMap((name) => webVitals[name] ?? []);

  return (
    <Panel id={panelElementId(NETWORK_PANEL)} title="Network" open={networkOpen}>
      <div className="analytics-section-title">Web Vitals</div>
      <StatsTable
        columns={['Metric', 'Value', 'Rating']}
        rows={metrics}
        emptyText="Collecting metrics..."
        renderRow={(metric) => {
          const targetElement =
            metric.name === 'LCP'
              ? getLcpElement(metric)
              : metric.name === 'INP'
                ? getInpElement(metric)
                : metric.name === 'CLS'
                  ? getClsElement(metric)
                  : null;

          return (
            <tr
              key={metric.name}
              className={targetElement ? 'stats-table-row' : ''}
              onClick={targetElement ? () => highlightElement(targetElement) : undefined}
            >
              <td>{metric.name}</td>
              <td>{formatWebVitalValue(metric)}</td>
              <td className={`vitals-rating-${metric.rating}`}>{metric.rating}</td>
            </tr>
          );
        }}
      />
    </Panel>
  );
}
