import { Cartesian3, Math as CesiumMath, type Viewer } from 'cesium';
import { AMSTERDAM } from '../../cesium/cesiumConfig';
import type { LoadStepResult } from '../../store/benchmarkSlice';
import { BENCHMARK_DEVTOOLS_TRACK, MAP_LOADED_QUIET_MS, MAP_LOADED_TIMEOUT_MS } from './benchmarkConfig';
import { waitForQueueQuiet } from './waitForQueueQuiet';

const STEP_HEIGHTS = [5_000, 500];

function formatHeight(height: number): string {
  return height >= 1000 ? `${height / 1000} km` : `${height} m`;
}

function waitForMapLoaded(viewer: Viewer): Promise<number> {
  return waitForQueueQuiet({
    subscribe: (listener) => viewer.scene.globe.tileLoadProgressEvent.addEventListener(listener),
    quietMs: MAP_LOADED_QUIET_MS,
    timeoutMs: MAP_LOADED_TIMEOUT_MS,
  });
}

export async function runLoadBenchmark(viewer: Viewer, onStep: (result: LoadStepResult) => void): Promise<void> {
  await waitForMapLoaded(viewer);

  for (const height of STEP_HEIGHTS) {
    const label = formatHeight(height);
    const start = performance.now();

    viewer.camera.setView({
      destination: Cartesian3.fromDegrees(AMSTERDAM.lon, AMSTERDAM.lat, height),
      orientation: { heading: 0, pitch: -CesiumMath.PI_OVER_TWO, roll: 0 },
    });

    const end = await waitForMapLoaded(viewer);
    const loadMs = Math.round(end - start);

    performance.measure(`Map loaded · ${label}`, {
      start,
      end,
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: BENCHMARK_DEVTOOLS_TRACK,
          color: 'primary',
          tooltipText: `${label}: ${loadMs} ms`,
        },
      },
    });

    onStep({ label, height, loadMs });
  }
}
