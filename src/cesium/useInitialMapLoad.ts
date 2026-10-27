import { useEffect } from 'react';
import { BENCHMARK_DEVTOOLS_TRACK, MAP_LOADED_QUIET_MS, MAP_LOADED_TIMEOUT_MS } from '../lib/benchmark/benchmarkConfig';
import { waitForQueueQuiet } from '../lib/benchmark/waitForQueueQuiet';
import { initialLoadMeasured } from '../store/benchmarkSlice';
import { useAppDispatch } from '../store/hooks';
import { useViewer } from './viewerStore';

let firstHiddenAt = document.visibilityState === 'hidden' ? 0 : Infinity;

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    firstHiddenAt = Math.min(firstHiddenAt, performance.now());
  }
});

function tabWasHiddenBefore(time: number): boolean {
  const hiddenEntry = performance
    .getEntriesByType('visibility-state')
    .some((entry) => entry.name === 'hidden' && entry.startTime <= time);

  return hiddenEntry || firstHiddenAt <= time;
}

export function useInitialMapLoad() {
  const viewer = useViewer();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!viewer) {
      return;
    }

    let cancelled = false;

    waitForQueueQuiet({
      subscribe: (listener) => viewer.scene.globe.tileLoadProgressEvent.addEventListener(listener),
      quietMs: MAP_LOADED_QUIET_MS,
      timeoutMs: MAP_LOADED_TIMEOUT_MS,
    })
      .then((end) => {
        if (cancelled) {
          return;
        }

        const loadMs = Math.round(end);

        performance.measure('Map loaded · page open', {
          start: 0,
          end,
          detail: {
            devtools: {
              dataType: 'track-entry',
              track: BENCHMARK_DEVTOOLS_TRACK,
              color: 'primary',
              tooltipText: `Page open: ${loadMs} ms`,
            },
          },
        });

        dispatch(initialLoadMeasured({ ms: loadMs, tabWasHidden: tabWasHiddenBefore(end) }));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [viewer, dispatch]);
}
