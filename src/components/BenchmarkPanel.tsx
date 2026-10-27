import { useInitialMapLoad } from '../cesium/useInitialMapLoad';
import { useViewer } from '../cesium/viewerStore';
import { BENCHMARK_PANEL, BENCHMARK_STATUS } from '../constants';
import { useWebVitals } from '../hooks/useWebVitals';
import { describeElement } from '../lib/describeElement';
import { getLcpElement } from '../lib/getLcpElement';
import { highlightElement } from '../lib/highlightElement';
import { panelElementId } from '../lib/panelElementId';
import {
  benchmarkFailed,
  benchmarkFinished,
  benchmarkStarted,
  benchmarkStepFinished,
  selectBenchmarkError,
  selectBenchmarkResults,
  selectBenchmarkStatus,
  selectInitialLoad,
} from '../store/benchmarkSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectIsPanelOpen } from '../store/uiSlice';
import { Panel } from './ui/Panel';
import { StatsTable } from './ui/StatsTable';

interface PageOpenRow {
  label: string;
  ms: number;
  element: Element | null;
}

function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(2)} s`;
}

export function BenchmarkPanel() {
  const benchmarkOpen = useAppSelector((s) => selectIsPanelOpen(s, BENCHMARK_PANEL));
  const status = useAppSelector(selectBenchmarkStatus);
  const results = useAppSelector(selectBenchmarkResults);
  const error = useAppSelector(selectBenchmarkError);
  const initialLoad = useAppSelector(selectInitialLoad);
  const lcp = useWebVitals().LCP;
  const viewer = useViewer();
  const dispatch = useAppDispatch();

  useInitialMapLoad();

  const running = status === BENCHMARK_STATUS.RUNNING;
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

    dispatch(benchmarkStarted());

    try {
      const { runLoadBenchmark } = await import('../lib/benchmark/runLoadBenchmark');

      await runLoadBenchmark(viewer, (result) => dispatch(benchmarkStepFinished(result)));
      dispatch(benchmarkFinished());
    } catch (error) {
      dispatch(benchmarkFailed(error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <Panel id={panelElementId(BENCHMARK_PANEL)} title="Benchmark" open={benchmarkOpen}>
      <p className="benchmark-text">
        Measures how long the map takes to fully load: once when the page opens, and then at 5 km and 500 m above
        Amsterdam after you press Start. Each step also shows up on a Benchmark track in DevTools → Performance.
      </p>
      <div className="benchmark-actions">
        <button className="benchmark-start" onClick={start} disabled={running || !viewer}>
          {running ? 'Running…' : 'Start'}
        </button>
        <span className="benchmark-conditions">
          {window.innerWidth}×{window.innerHeight} · DPR {Number(window.devicePixelRatio.toFixed(2))}
        </span>
      </div>
      {error && <p className="benchmark-error">{error}</p>}
      <div className="analytics-section-title">Page open</div>
      <StatsTable
        columns={['What', 'Time']}
        rows={pageOpenRows}
        emptyText="Waiting for the map to load…"
        renderRow={({ label, ms, element }) => (
          <tr
            key={label}
            className={element ? 'stats-table-row' : ''}
            onClick={element ? () => highlightElement(element) : undefined}
          >
            <td>{label}</td>
            <td>{formatSeconds(ms)}</td>
          </tr>
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
      <div className="analytics-section-title">After a camera jump</div>
      <StatsTable
        columns={['Height', 'Time']}
        rows={results}
        emptyText={running ? 'Measuring…' : 'Press Start to measure'}
        renderRow={(result) => (
          <tr key={result.label}>
            <td>{result.label}</td>
            <td>{formatSeconds(result.loadMs)}</td>
          </tr>
        )}
      />
    </Panel>
  );
}
