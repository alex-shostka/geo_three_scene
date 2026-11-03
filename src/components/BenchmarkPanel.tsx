import { useRef } from 'react';
import StopwatchIcon from '../assets/icons/stopwatch.svg?react';
import { useInitialMapLoad } from '../cesium/useInitialMapLoad';
import { useViewer } from '../cesium/viewerStore';
import { BENCHMARK_PANEL, BENCHMARK_STATUS } from '../constants';
import { useWebVitals } from '../hooks/useWebVitals';
import { readFlightSeconds } from '../lib/benchmark/benchmarkConfig';
import { describeElement } from '../lib/describeElement';
import { getLcpElement } from '../lib/getLcpElement';
import { highlightElement } from '../lib/highlightElement';
import {
  benchmarkCancelled,
  benchmarkFailed,
  benchmarkFinished,
  benchmarkStarted,
  benchmarkStepFinished,
  selectBenchmarkConditions,
  selectBenchmarkError,
  selectBenchmarkResults,
  selectBenchmarkStatus,
  selectInitialLoad,
  type RunConditions,
} from '../store/benchmarkSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { Panel } from './ui/Panel';
import { StatsTable } from './ui/StatsTable';
import { usePanel } from './usePanel';

interface PageOpenRow {
  label: string;
  ms: number;
  element: Element | null;
}

function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(2)} s`;
}

function currentConditions(): RunConditions {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: Number(window.devicePixelRatio.toFixed(2)),
    flightSeconds: readFlightSeconds(window.location.search),
  };
}

export function BenchmarkPanel() {
  const panel = usePanel(BENCHMARK_PANEL);
  const status = useAppSelector(selectBenchmarkStatus);
  const results = useAppSelector(selectBenchmarkResults);
  const error = useAppSelector(selectBenchmarkError);
  const runConditions = useAppSelector(selectBenchmarkConditions);
  const initialLoad = useAppSelector(selectInitialLoad);
  const lcp = useWebVitals().LCP;
  const viewer = useViewer();
  const dispatch = useAppDispatch();
  const abortControllerRef = useRef<AbortController | null>(null);

  useInitialMapLoad();

  const running = status === BENCHMARK_STATUS.RUNNING;
  const conditions = runConditions ?? currentConditions();
  const routeMs = results.reduce((total, result) => total + result.loadMs, 0);
  const lcpElement = lcp ? getLcpElement(lcp) : null;
  const pageOpenRows: PageOpenRow[] = [];

  if (lcp) {
    pageOpenRows.push({
      label: lcpElement ? `LCP · ${describeElement(lcpElement)}` : 'LCP',
      ms: lcp.value,
      element: lcpElement,
    });
  }

  if (initialLoad) {
    pageOpenRows.push({ label: 'Map fully loaded', ms: initialLoad.ms, element: null });
  }

  const start = async () => {
    if (!viewer) {
      return;
    }

    const startConditions = currentConditions();
    const abortController = new AbortController();

    abortControllerRef.current = abortController;
    dispatch(benchmarkStarted(startConditions));

    try {
      const { runLoadBenchmark } = await import('../lib/benchmark/runLoadBenchmark');

      await runLoadBenchmark(viewer, {
        flightSeconds: startConditions.flightSeconds,
        signal: abortController.signal,
        onStep: (result) => dispatch(benchmarkStepFinished(result)),
      });
      dispatch(benchmarkFinished());
    } catch (error) {
      if (abortController.signal.aborted) {
        dispatch(benchmarkCancelled());

        return;
      }

      dispatch(benchmarkFailed(error instanceof Error ? error.message : String(error)));
    } finally {
      abortControllerRef.current = null;
    }
  };

  const cancel = () => {
    abortControllerRef.current?.abort(new Error('The benchmark was cancelled'));
  };

  return (
    <Panel {...panel}>
      <Panel.Trigger id="benchmark-btn" label="Benchmark">
        <StopwatchIcon aria-hidden="true" />
      </Panel.Trigger>
      <Panel.Content title="Benchmark">
        <p className="benchmark-text">
          Measures how long the map takes to fully load: once when the page opens, and then at every step of a fixed
          camera route over Amsterdam after you press Start. Each step also shows up on a Benchmark track in DevTools →
          Performance.
        </p>
        <div className="benchmark-actions">
          {running ? (
            <button className="benchmark-start" onClick={cancel}>
              Cancel
            </button>
          ) : (
            <button className="benchmark-start" onClick={start} disabled={!viewer}>
              Start
            </button>
          )}
          <span className="benchmark-conditions">
            {conditions.width}×{conditions.height} · DPR {conditions.devicePixelRatio} · flight{' '}
            {conditions.flightSeconds} s
          </span>
        </div>
        {error && <p className="benchmark-error">{error}</p>}

        <Panel.Section title="Page open">
          <StatsTable
            columns={['What', 'Time']}
            rows={pageOpenRows}
            getRowKey={(row) => row.label}
            emptyText="Waiting for the map to load…"
            renderRow={({ label, ms, element }) => (
              <StatsTable.Row onClick={element ? () => highlightElement(element) : undefined}>
                <td>{label}</td>
                <td>{formatSeconds(ms)}</td>
              </StatsTable.Row>
            )}
          />
          {initialLoad?.tabWasHidden && (
            <p className="benchmark-note benchmark-warning">
              The tab was in the background while the page loaded, so this time is not representative and the browser
              doesn't report LCP. Reload the page with the tab open.
            </p>
          )}
          {lcp && initialLoad && !initialLoad.tabWasHidden && (
            <p className="benchmark-note">
              The map was fully loaded {(initialLoad.ms / lcp.value).toFixed(1)}× later than LCP reported.
            </p>
          )}
        </Panel.Section>

        <Panel.Section title="Camera route">
          <StatsTable
            columns={['#', 'Height', 'Time', 'After stop']}
            rows={results}
            getRowKey={(result) => result.step}
            emptyText={running ? 'Measuring…' : 'Press Start to measure'}
            renderRow={(result) => (
              <StatsTable.Row>
                <td>{result.step}</td>
                <td>{result.label}</td>
                <td>{formatSeconds(result.loadMs)}</td>
                <td>{formatSeconds(result.afterArrivalMs)}</td>
              </StatsTable.Row>
            )}
          />
          {status === BENCHMARK_STATUS.DONE && <p className="benchmark-note">Full route: {formatSeconds(routeMs)}</p>}
          {status === BENCHMARK_STATUS.CANCELLED && (
            <p className="benchmark-note benchmark-warning">Cancelled after {results.length} steps.</p>
          )}
        </Panel.Section>
      </Panel.Content>
    </Panel>
  );
}
