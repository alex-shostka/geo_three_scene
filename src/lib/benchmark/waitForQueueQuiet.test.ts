import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { waitForQueueQuiet, type QueueListener } from './waitForQueueQuiet';

function createQueue() {
  const listeners = new Set<QueueListener>();

  return {
    subscribe(listener: QueueListener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    emit(pending: number) {
      listeners.forEach((listener) => listener(pending));
    },
    get listenerCount() {
      return listeners.size;
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('waitForQueueQuiet', () => {
  it('returns the moment the queue became empty, not the end of the quiet period', async () => {
    const queue = createQueue();
    const result = waitForQueueQuiet({ subscribe: queue.subscribe, quietMs: 500, timeoutMs: 10_000, now: Date.now });

    await vi.advanceTimersByTimeAsync(100);
    queue.emit(12);
    await vi.advanceTimersByTimeAsync(1_100);
    queue.emit(0);
    await vi.advanceTimersByTimeAsync(500);

    await expect(result).resolves.toBe(1_200);
  });

  it('ignores a short empty moment in the middle of loading', async () => {
    const queue = createQueue();
    const result = waitForQueueQuiet({ subscribe: queue.subscribe, quietMs: 500, timeoutMs: 10_000, now: Date.now });

    queue.emit(5);
    await vi.advanceTimersByTimeAsync(300);
    queue.emit(0);
    await vi.advanceTimersByTimeAsync(200);
    queue.emit(3);
    await vi.advanceTimersByTimeAsync(400);
    queue.emit(0);
    await vi.advanceTimersByTimeAsync(500);

    await expect(result).resolves.toBe(900);
  });

  it('returns the start time when nothing gets queued', async () => {
    const queue = createQueue();
    const result = waitForQueueQuiet({ subscribe: queue.subscribe, quietMs: 500, timeoutMs: 10_000, now: Date.now });

    await vi.advanceTimersByTimeAsync(500);

    await expect(result).resolves.toBe(0);
    expect(queue.listenerCount).toBe(0);
  });

  it('fails when the queue never stays empty', async () => {
    const queue = createQueue();
    const result = waitForQueueQuiet({ subscribe: queue.subscribe, quietMs: 500, timeoutMs: 2_000, now: Date.now });
    const assertion = expect(result).rejects.toThrow('within 2 s');

    queue.emit(1);
    await vi.advanceTimersByTimeAsync(2_000);

    await assertion;
    expect(queue.listenerCount).toBe(0);
  });
});
