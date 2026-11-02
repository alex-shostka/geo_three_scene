import type { QueueListener } from './benchmark/waitForQueueQuiet';

export function onQueueSettled(callback: () => void, settleMs: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const listener: QueueListener = (pending) => {
    clearTimeout(timer);

    if (pending === 0) {
      timer = setTimeout(callback, settleMs);
    }
  };

  const cancel = () => {
    clearTimeout(timer);
  };

  return { listener, cancel };
}
