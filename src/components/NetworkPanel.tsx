import type { MetricType } from 'web-vitals';
import NetworkIcon from '../assets/icons/network.svg?react';
import { NETWORK_PANEL } from '../constants';
import { useWebVitals } from '../hooks/useWebVitals';
import { formatWebVitalValue } from '../lib/formatWebVitalValue';
import { getClsElement } from '../lib/getClsElement';
import { getInpElement } from '../lib/getInpElement';
import { getLcpElement } from '../lib/getLcpElement';
import { highlightElement } from '../lib/highlightElement';
import { Panel } from './ui/Panel';
import { StatsTable } from './ui/StatsTable';
import { usePanel } from './usePanel';

const WEB_VITALS_ORDER: MetricType['name'][] = ['FCP', 'LCP', 'INP', 'CLS', 'TTFB'];

export function NetworkPanel() {
  const panel = usePanel(NETWORK_PANEL);
  const webVitals = useWebVitals();
  const metrics = WEB_VITALS_ORDER.flatMap((name) => webVitals[name] ?? []);

  return (
    <Panel {...panel}>
      <Panel.Trigger id="network-btn" label="Network">
        <NetworkIcon aria-hidden="true" />
      </Panel.Trigger>
      <Panel.Content title="Network">
        <Panel.Section title="Web Vitals">
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
                <StatsTable.Row
                  key={metric.name}
                  onClick={targetElement ? () => highlightElement(targetElement) : undefined}
                >
                  <td>{metric.name}</td>
                  <td>{formatWebVitalValue(metric)}</td>
                  <td className={`vitals-rating-${metric.rating}`}>{metric.rating}</td>
                </StatsTable.Row>
              );
            }}
          />
        </Panel.Section>
      </Panel.Content>
    </Panel>
  );
}
