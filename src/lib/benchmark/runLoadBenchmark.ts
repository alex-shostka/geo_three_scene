import { Cartesian3, Math as CesiumMath, type Viewer } from 'cesium';
import { AMSTERDAM, HOME_HEIGHT } from '../../cesium/cesiumConfig';
import type { LoadStepResult } from '../../store/benchmarkSlice';
import {
  BENCHMARK_DEVTOOLS_TRACK,
  MAP_LOADED_QUIET_MS,
  MAP_LOADED_TIMEOUT_MS,
  ROUTE_HEIGHT_RATIO,
  ROUTE_MIN_HEIGHT,
  ROUTE_PITCH_DEG,
  ROUTE_START_HEIGHT,
} from './benchmarkConfig';
import { buildCameraRoute, formatHeight, type CameraRoutePoint } from './cameraRoute';
import { waitForQueueQuiet } from './waitForQueueQuiet';

export interface LoadBenchmarkOptions {
  runs: number;
  flightSeconds: number;
  signal: AbortSignal;
  onRunStart: (run: number) => void;
  onStep: (result: LoadStepResult) => void;
}

export class TabHiddenError extends Error {
  constructor() {
    super('The tab went to the background, so the benchmark stopped. Keep the tab open while it runs.');
    this.name = 'TabHiddenError';
  }
}

export const CAMERA_ROUTE = buildCameraRoute({
  target: AMSTERDAM,
  startHeight: ROUTE_START_HEIGHT,
  minHeight: ROUTE_MIN_HEIGHT,
  heightRatio: ROUTE_HEIGHT_RATIO,
  pitchDeg: ROUTE_PITCH_DEG,
});

function waitForMapLoaded(viewer: Viewer, signal: AbortSignal): Promise<number> {
  return waitForQueueQuiet({
    subscribe: (listener) => viewer.scene.globe.tileLoadProgressEvent.addEventListener(listener),
    quietMs: MAP_LOADED_QUIET_MS,
    timeoutMs: MAP_LOADED_TIMEOUT_MS,
    signal,
  });
}

function flyTo(viewer: Viewer, point: CameraRoutePoint, flightSeconds: number, signal: AbortSignal): Promise<number> {
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      viewer.camera.cancelFlight();
      reject(signal.reason);
    };

    signal.addEventListener('abort', onAbort, { once: true });

    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(point.lon, point.lat, point.height),
      orientation: {
        heading: CesiumMath.toRadians(point.headingDeg),
        pitch: CesiumMath.toRadians(point.pitchDeg),
        roll: 0,
      },
      duration: flightSeconds,
      complete: () => {
        signal.removeEventListener('abort', onAbort);
        resolve(performance.now());
      },
      cancel: () => {
        signal.removeEventListener('abort', onAbort);
        reject(signal.aborted ? signal.reason : new Error('The camera flight was interrupted'));
      },
    });
  });
}

function stopWhenTabHidden(signal: AbortSignal): { signal: AbortSignal; release: () => void } {
  const controller = new AbortController();
  const forwardAbort = () => controller.abort(signal.reason);
  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      controller.abort(new TabHiddenError());
    }
  };

  signal.addEventListener('abort', forwardAbort, { once: true });
  document.addEventListener('visibilitychange', onVisibilityChange);
  onVisibilityChange();

  return {
    signal: controller.signal,
    release: () => {
      signal.removeEventListener('abort', forwardAbort);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    },
  };
}

async function flyRoute(
  viewer: Viewer,
  run: number,
  flightSeconds: number,
  signal: AbortSignal,
  onStep: LoadBenchmarkOptions['onStep'],
) {
  viewer.camera.setView({ destination: Cartesian3.fromDegrees(AMSTERDAM.lon, AMSTERDAM.lat, HOME_HEIGHT) });
  await waitForMapLoaded(viewer, signal);

  for (const [index, point] of CAMERA_ROUTE.entries()) {
    const step = index + 1;
    const label = formatHeight(point.height);
    const start = performance.now();
    const arrival = await flyTo(viewer, point, flightSeconds, signal);
    const end = await waitForMapLoaded(viewer, signal);
    const loadMs = Math.round(end - start);
    const afterArrivalMs = Math.round(end - arrival);

    performance.measure(`Run ${run} · step ${step} · ${label}`, {
      start,
      end,
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: BENCHMARK_DEVTOOLS_TRACK,
          color: 'primary',
          tooltipText: `Run ${run}, step ${step}, ${label}: ${loadMs} ms (${afterArrivalMs} ms after the camera stopped)`,
        },
      },
    });

    onStep({ step, label, height: point.height, loadMs, afterArrivalMs });
  }
}

export async function runLoadBenchmark(
  viewer: Viewer,
  { runs, flightSeconds, signal, onRunStart, onStep }: LoadBenchmarkOptions,
) {
  const guard = stopWhenTabHidden(signal);

  try {
    guard.signal.throwIfAborted();
    await waitForMapLoaded(viewer, guard.signal);

    for (let run = 1; run <= runs; run++) {
      onRunStart(run);
      await flyRoute(viewer, run, flightSeconds, guard.signal, onStep);
    }
  } finally {
    guard.release();
  }
}
