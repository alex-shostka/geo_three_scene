import type { MetricType } from 'web-vitals';
import { NETWORK_PANEL } from '../constants';
import { useWebVitals } from '../hooks/useWebVitals';
import { formatWebVitalValue } from '../lib/formatWebVitalValue';
import { getClsElement } from '../lib/getClsElement';
import { getInpElement } from '../lib/getInpElement';
import { getLcpElement } from '../lib/getLcpElement';
import { highlightElement } from '../lib/highlightElement';
import { useAppSelector } from '../store/hooks';
import { selectIsPanelOpen } from '../store/uiSlice';

const WEB_VITALS_ORDER: MetricType['name'][] = ['FCP', 'LCP', 'INP', 'CLS', 'TTFB'];

export function NetworkPanel() {
  const networkOpen = useAppSelector((s) => selectIsPanelOpen(s, NETWORK_PANEL));
  const webVitals = useWebVitals();
  const metrics = WEB_VITALS_ORDER.flatMap((name) => webVitals[name] ?? []);

  return (
    <aside id="network-panel" className={networkOpen ? 'open' : ''}>
      <div id="network-panel-header">
        <span id="network-panel-title">Network</span>
      </div>
      <div id="network-panel-content">
        <div className="analytics-section-title">Web Vitals</div>
        <table className="stats-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            {metrics.length === 0 ? (
              <tr>
                <td className="stats-table-empty" colSpan={3}>
                  Collecting metrics...
                </td>
              </tr>
            ) : (
              metrics.map((metric) => {
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
              })
            )}
          </tbody>
        </table>
      </div>
    </aside>
  );
}
