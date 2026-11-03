import { Cartesian3, Math as CesiumMath, type Viewer } from 'cesium';
import { AMSTERDAM } from '../../cesium/cesiumConfig';
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
  flightSeconds: number;
  signal: AbortSignal;
  onStep: (result: LoadStepResult) => void;
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

export async function runLoadBenchmark(viewer: Viewer, { flightSeconds, signal, onStep }: LoadBenchmarkOptions) {
  await waitForMapLoaded(viewer, signal);

  for (const [index, point] of CAMERA_ROUTE.entries()) {
    const step = index + 1;
    const label = formatHeight(point.height);
    const start = performance.now();
    const arrival = await flyTo(viewer, point, flightSeconds, signal);
    const end = await waitForMapLoaded(viewer, signal);
    const loadMs = Math.round(end - start);
    const afterArrivalMs = Math.round(end - arrival);

    performance.measure(`Step ${step} · ${label}`, {
      start,
      end,
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: BENCHMARK_DEVTOOLS_TRACK,
          color: 'primary',
          tooltipText: `Step ${step}, ${label}: ${loadMs} ms (${afterArrivalMs} ms after the camera stopped)`,
        },
      },
    });

    onStep({ step, label, height: point.height, loadMs, afterArrivalMs });
  }
}
