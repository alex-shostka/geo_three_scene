import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { onQueueSettled } from './onQueueSettled';

const SETTLE_MS = 250;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('onQueueSettled', () => {
  it('calls back once the queue stays empty for the settle period', () => {
    const callback = vi.fn();
    const { listener } = onQueueSettled(callback, SETTLE_MS);

    listener(0);
    vi.advanceTimersByTime(SETTLE_MS - 1);

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    expect(callback).toHaveBeenCalledOnce();
  });

  it('does not call back when tiles arrive before the queue settles', () => {
    const callback = vi.fn();
    const { listener } = onQueueSettled(callback, SETTLE_MS);

    listener(0);
    vi.advanceTimersByTime(SETTLE_MS - 1);
    listener(3);
    vi.advanceTimersByTime(SETTLE_MS);

    expect(callback).not.toHaveBeenCalled();
  });

  it('calls back once, counting from the last time the queue emptied', () => {
    const callback = vi.fn();
    const { listener } = onQueueSettled(callback, SETTLE_MS);

    listener(0);
    vi.advanceTimersByTime(100);
    listener(5);
    listener(0);
    vi.advanceTimersByTime(SETTLE_MS - 1);

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    expect(callback).toHaveBeenCalledOnce();
  });

  it('does not call back after cancel', () => {
    const callback = vi.fn();
    const { listener, cancel } = onQueueSettled(callback, SETTLE_MS);

    listener(0);
    cancel();
    vi.advanceTimersByTime(SETTLE_MS);

    expect(callback).not.toHaveBeenCalled();
  });
});
