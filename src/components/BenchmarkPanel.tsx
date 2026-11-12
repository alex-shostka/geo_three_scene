import { useMemo, useRef, useState } from 'react';
import StopwatchIcon from '../assets/icons/stopwatch.svg?react';
import { useInitialMapLoad } from '../cesium/useInitialMapLoad';
import { useViewer } from '../cesium/viewerStore';
import { BENCHMARK_PANEL, BENCHMARK_STATUS, EMPTY_VALUE } from '../constants';
import { useWebVitals } from '../hooks/useWebVitals';
import { BENCHMARK_RUN_OPTIONS, readFlightSeconds } from '../lib/benchmark/benchmarkConfig';
import { summarizeRoute, summarizeRuns, warmupRunsFor, type StepSummary } from '../lib/benchmark/summarizeRuns';
import { describeElement } from '../lib/describeElement';
import { getLcpElement } from '../lib/getLcpElement';
import { highlightElement } from '../lib/highlightElement';
import {
  benchmarkCancelled,
  benchmarkFailed,
  benchmarkFinished,
  benchmarkRunStarted,
  benchmarkStarted,
  benchmarkStepFinished,
  selectBenchmarkConditions,
  selectBenchmarkError,
  selectBenchmarkRuns,
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

function formatSpread({ samples, p25Ms, p75Ms }: Pick<StepSummary, 'samples' | 'p25Ms' | 'p75Ms'>): string {
  if (samples < 3) {
    return EMPTY_VALUE;
  }

  return `${(p25Ms / 1000).toFixed(2)}–${formatSeconds(p75Ms)}`;
}

function currentConditions(runs: number): RunConditions {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: Number(window.devicePixelRatio.toFixed(2)),
    flightSeconds: readFlightSeconds(window.location.search),
    runs,
  };
}

function downloadJson(fileName: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function BenchmarkPanel() {
  const panel = usePanel(BENCHMARK_PANEL);
  const status = useAppSelector(selectBenchmarkStatus);
  const runs = useAppSelector(selectBenchmarkRuns);
  const error = useAppSelector(selectBenchmarkError);
  const runConditions = useAppSelector(selectBenchmarkConditions);
  const initialLoad = useAppSelector(selectInitialLoad);
  const lcp = useWebVitals().LCP;
  const viewer = useViewer();
  const dispatch = useAppDispatch();
  const abortControllerRef = useRef<AbortController | null>(null);
  const [runCount, setRunCount] = useState<number>(BENCHMARK_RUN_OPTIONS[0]);

  useInitialMapLoad();

  const running = status === BENCHMARK_STATUS.RUNNING;
  const conditions = runConditions ?? currentConditions(runCount);
  const warmupRuns = warmupRunsFor(conditions.runs);
  const summaries = useMemo(() => summarizeRuns(runs, warmupRuns), [runs, warmupRuns]);
  const route = useMemo(() => summarizeRoute(runs, warmupRuns, summaries.length), [runs, warmupRuns, summaries.length]);
  const finishedSteps = runs.reduce((total, run) => total + run.length, 0);
  const inWarmup = running && runs.length <= warmupRuns;
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

    const startConditions = currentConditions(runCount);
    const abortController = new AbortController();

    abortControllerRef.current = abortController;
    dispatch(benchmarkStarted(startConditions));

    try {
      const { runLoadBenchmark } = await import('../lib/benchmark/runLoadBenchmark');

      await runLoadBenchmark(viewer, {
        runs: startConditions.runs,
        flightSeconds: startConditions.flightSeconds,
        signal: abortController.signal,
        onRunStart: () => dispatch(benchmarkRunStarted()),
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

  const exportResults = () => {
    downloadJson(`benchmark-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`, {
      date: new Date().toISOString(),
      userAgent: navigator.userAgent,
      conditions,
      warmupRuns,
      route,
      steps: summaries,
      runs,
    });
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
          <label className="benchmark-runs">
            Runs
            <select value={runCount} disabled={running} onChange={(event) => setRunCount(Number(event.target.value))}>
              {BENCHMARK_RUN_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
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
          {conditions.runs > 1 && (
            <p className="benchmark-note benchmark-route-note">
              The first run warms up the cache and is not counted. Median and middle half (25th–75th percentile) of the
              other {conditions.runs - warmupRuns} runs.
            </p>
          )}
          <StatsTable
            columns={
              conditions.runs > 1
                ? ['#', 'Height', 'Median', 'Middle half', 'After stop']
                : ['#', 'Height', 'Time', 'After stop']
            }
            rows={summaries}
            getRowKey={(summary) => summary.step}
            emptyText={
              inWarmup ? `Warm-up run… ${finishedSteps} steps` : running ? 'Measuring…' : 'Press Start to measure'
            }
            renderRow={(summary) => (
              <StatsTable.Row>
                <td>{summary.step}</td>
                <td>{summary.label}</td>
                <td>{formatSeconds(summary.medianMs)}</td>
                {conditions.runs > 1 && <td>{formatSpread(summary)}</td>}
                <td>{formatSeconds(summary.medianAfterArrivalMs)}</td>
              </StatsTable.Row>
            )}
          />
          {running && conditions.runs > 1 && (
            <p className="benchmark-note">
              Run {runs.length} of {conditions.runs}
            </p>
          )}
          {status === BENCHMARK_STATUS.DONE && route && (
            <div className="benchmark-summary">
              <p className="benchmark-note">
                Full route: {formatSeconds(route.medianMs)}
                {route.samples >= 3 && `, middle half ${formatSpread(route)}`}
              </p>
              <button className="benchmark-export" onClick={exportResults}>
                Download JSON
              </button>
            </div>
          )}
          {status === BENCHMARK_STATUS.CANCELLED && (
            <p className="benchmark-note benchmark-warning">
              Cancelled in run {runs.length} of {conditions.runs}, after {finishedSteps} steps in total.
            </p>
          )}
        </Panel.Section>
      </Panel.Content>
    </Panel>
  );
}
