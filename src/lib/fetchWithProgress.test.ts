import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchWithProgress } from './fetchWithProgress';

const bytes = new Uint8Array([1, 2, 3, 4]);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchWithProgress', () => {
  it('returns the downloaded bytes and reports progress', async () => {
    vi.stubGlobal('fetch', async () => new Response(bytes, { headers: { 'Content-Length': '4' } }));
    const onProgress = vi.fn();

    const result = await fetchWithProgress('/doom.jsdos', { onProgress });

    expect(result).toEqual(bytes);
    expect(onProgress).toHaveBeenLastCalledWith(4, 4);
  });

  it('reports an unknown total without Content-Length', async () => {
    vi.stubGlobal('fetch', async () => new Response(bytes));
    const onProgress = vi.fn();

    await fetchWithProgress('/doom.jsdos', { onProgress });

    expect(onProgress).toHaveBeenLastCalledWith(4, null);
  });

  it('throws on an HTTP error', async () => {
    vi.stubGlobal('fetch', async () => new Response(null, { status: 404 }));

    await expect(fetchWithProgress('/doom.jsdos', { onProgress: vi.fn() })).rejects.toThrow('404');
  });
});
