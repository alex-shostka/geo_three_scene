import { describe, expect, it } from 'vitest';
import { countTilesByLevel, formatTileLevels, sumTileTraffic } from './tileStats';

describe('countTilesByLevel', () => {
  it('counts tiles per level in level order', () => {
    expect(countTilesByLevel([14, 12, 13, 14, 12, 14])).toEqual([
      { level: 12, tiles: 2 },
      { level: 13, tiles: 1 },
      { level: 14, tiles: 3 },
    ]);
  });

  it('returns nothing for no tiles', () => {
    expect(countTilesByLevel([])).toEqual([]);
  });
});

describe('sumTileTraffic', () => {
  it('counts only requests under the tile path', () => {
    const traffic = sumTileTraffic(
      [
        { name: 'https://example.com/tiles/12/2100/1345.png', transferSize: 12_000 },
        { name: 'https://example.com/tiles/13/4200/2690.png', transferSize: 0 },
        { name: 'https://example.com/tiles_glb_meta_ext/12/2100/1345.glb', transferSize: 5000 },
        { name: 'https://example.com/assets/index.js', transferSize: 90_000 },
      ],
      '/tiles/',
    );

    expect(traffic).toEqual({ requests: 2, bytes: 12_000 });
  });
});

describe('formatTileLevels', () => {
  it('lists each level with its tile count', () => {
    expect(
      formatTileLevels([
        { level: 12, tiles: 2 },
        { level: 14, tiles: 30 },
      ]),
    ).toBe('L12×2 L14×30');
  });
});
