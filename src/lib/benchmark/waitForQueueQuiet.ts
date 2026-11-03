export type QueueListener = (pending: number) => void;

export interface WaitForQueueQuietOptions {
  subscribe: (listener: QueueListener) => () => void;
  quietMs: number;
  timeoutMs: number;
  signal?: AbortSignal;
  now?: () => number;
}

export function waitForQueueQuiet({
  subscribe,
  quietMs,
  timeoutMs,
  signal,
  now = () => performance.now(),
}: WaitForQueueQuietOptions): Promise<number> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);

      return;
    }

    let emptySince: number | null = now();
    let quietTimer: ReturnType<typeof setTimeout> | undefined;

    const cleanup = () => {
      clearTimeout(quietTimer);
      clearTimeout(timeoutTimer);
      unsubscribe();
      signal?.removeEventListener('abort', onAbort);
    };

    const onAbort = () => {
      cleanup();
      reject(signal?.reason);
    };

    const armQuietTimer = (since: number) => {
      clearTimeout(quietTimer);
      quietTimer = setTimeout(() => {
        cleanup();
        resolve(since);
      }, quietMs);
    };

    const unsubscribe = subscribe((pending) => {
      if (pending > 0) {
        emptySince = null;
        clearTimeout(quietTimer);

        return;
      }

      if (emptySince === null) {
        emptySince = now();
        armQuietTimer(emptySince);
      }
    });

    const timeoutTimer = setTimeout(() => {
      cleanup();
      reject(new Error(`Tiles did not finish loading within ${timeoutMs / 1000} s`));
    }, timeoutMs);

    signal?.addEventListener('abort', onAbort);
    armQuietTimer(emptySince);
  });
}
