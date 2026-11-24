import { Cartesian3, Math as CesiumMath, type Viewer } from 'cesium';
import { AMSTERDAM, HOME_HEIGHT } from '../../cesium/cesiumConfig';
import { readRenderedTiles, type TileTriangles } from '../../cesium/tileWireframe';
import { getOverlayRenderer } from '../../three/overlayRendererStore';
import {
  BENCHMARK_DEVTOOLS_TRACK,
  MAP_LOADED_QUIET_MS,
  MAP_LOADED_TIMEOUT_MS,
  ROUTE_HEIGHT_RATIO,
  ROUTE_MIN_HEIGHT,
  ROUTE_PITCH_DEG,
  ROUTE_START_HEIGHT,
  TILE_PATH_PREFIX,
} from './benchmarkConfig';
import { buildCameraRoute, formatHeight, type CameraRoutePoint } from './cameraRoute';
import { recordDrawCalls, type DrawCallCount } from './countDrawCalls';
import type { FrameGeometry, LoadStepResult } from './summarizeRuns';
import { countTilesByLevel, sumTileTraffic, type TileTraffic } from './tileStats';
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

function overlayDrawCalls(): DrawCallCount | null {
  const renderer = getOverlayRenderer();

  if (!renderer) {
    return null;
  }

  return { drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles };
}

interface MeasuredFrame {
  frame: FrameGeometry;
  renderedTiles: TileTriangles[];
}

async function withTileTraffic<T extends object>(task: () => Promise<T>): Promise<T & { traffic: TileTraffic }> {
  const entries: PerformanceEntry[] = [];
  const observer = new PerformanceObserver((list) => {
    entries.push(...list.getEntries());
  });

  observer.observe({ type: 'resource' });

  try {
    const result = await task();

    entries.push(...observer.takeRecords());

    return { ...result, traffic: sumTileTraffic(entries as PerformanceResourceTiming[], TILE_PATH_PREFIX) };
  } finally {
    observer.disconnect();
  }
}

function measureNextFrame(viewer: Viewer, signal: AbortSignal): Promise<MeasuredFrame> {
  const gl = viewer.canvas.getContext('webgl2') ?? viewer.canvas.getContext('webgl');

  if (!gl) {
    return Promise.reject(new Error('The map has no WebGL context'));
  }

  const { scene } = viewer;

  return new Promise((resolve, reject) => {
    let recording: ReturnType<typeof recordDrawCalls> | null = null;

    const cleanUp = () => {
      recording?.stop();
      removePreRender();
      removePostRender();
      signal.removeEventListener('abort', onAbort);
    };
    const onAbort = () => {
      cleanUp();
      reject(signal.reason);
    };
    const removePreRender = scene.preRender.addEventListener(() => {
      recording ??= recordDrawCalls(gl);
    });
    const removePostRender = scene.postRender.addEventListener(() => {
      if (!recording) {
        return;
      }

      const map = { ...recording.count };

      cleanUp();
      resolve({ frame: { map, overlay: overlayDrawCalls() }, renderedTiles: readRenderedTiles(viewer) });
    });

    signal.addEventListener('abort', onAbort, { once: true });
    scene.requestRender();
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
    const { start, arrival, end, traffic } = await withTileTraffic(async () => {
      const start = performance.now();
      const arrival = await flyTo(viewer, point, flightSeconds, signal);
      const end = await waitForMapLoaded(viewer, signal);

      return { start, arrival, end };
    });
    const loadMs = Math.round(end - start);
    const afterArrivalMs = Math.round(end - arrival);
    const { frame, renderedTiles } = await measureNextFrame(viewer, signal);
    const tiles = {
      ...traffic,
      count: renderedTiles.length,
      triangles: renderedTiles.reduce((total, tile) => total + tile.triangles, 0),
      levels: countTilesByLevel(renderedTiles.map((tile) => tile.level)),
    };

    performance.measure(`Run ${run} · step ${step} · ${label}`, {
      start,
      end,
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: BENCHMARK_DEVTOOLS_TRACK,
          color: 'primary',
          tooltipText: `Run ${run}, step ${step}, ${label}: ${loadMs} ms (${afterArrivalMs} ms after the camera stopped), ${frame.map.triangles} triangles in ${frame.map.drawCalls} draw calls, ${tiles.count} tiles, ${tiles.requests} tile requests`,
        },
      },
    });

    onStep({ step, label, height: point.height, loadMs, afterArrivalMs, frame, tiles });
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
