import { useUi } from '../state/UiContext';
import { useWebVitals } from '../hooks/useWebVitals';
import { formatWebVitalValue } from '../lib/formatWebVitalValue';
import { getLcpElement } from '../lib/getLcpElement';
import { highlightElement } from '../lib/highlightElement';

const WEB_VITALS_ORDER = ['LCP', 'INP', 'CLS'] as const;
// const WEB_VITALS_ORDER = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'] as const;

export function NetworkPanel() {
  const { networkOpen } = useUi();
  const webVitals = useWebVitals();

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
            {WEB_VITALS_ORDER.every((name) => !webVitals[name]) ? (
              <tr>
                <td className="stats-table-empty" colSpan={3}>Collecting metrics...</td>
              </tr>
            ) : (
              WEB_VITALS_ORDER.filter((name) => webVitals[name]).map((name) => {
                const metric = webVitals[name]!;
                const lcpElement = name === 'LCP' ? getLcpElement(metric) : null;
                return (
                  <tr
                    key={name}
                    className={lcpElement ? 'stats-table-row' : ''}
                    onClick={lcpElement ? () => highlightElement(lcpElement) : undefined}
                  >
                    <td>{name}</td>
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
