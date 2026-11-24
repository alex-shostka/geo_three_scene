export interface TileLevelCount {
  level: number;
  tiles: number;
}

export interface TileTraffic {
  requests: number;
  bytes: number;
}

export interface StepTiles extends TileTraffic {
  count: number;
  triangles: number;
  levels: TileLevelCount[];
}

export interface ResourceEntryLike {
  name: string;
  transferSize: number;
}

export function countTilesByLevel(levels: number[]): TileLevelCount[] {
  const counts = new Map<number, number>();

  levels.forEach((level) => counts.set(level, (counts.get(level) ?? 0) + 1));

  return [...counts].map(([level, tiles]) => ({ level, tiles })).sort((first, second) => first.level - second.level);
}

export function sumTileTraffic(entries: ResourceEntryLike[], pathPrefix: string): TileTraffic {
  const tileEntries = entries.filter((entry) =>
    new URL(entry.name, 'http://localhost').pathname.startsWith(pathPrefix),
  );

  return {
    requests: tileEntries.length,
    bytes: tileEntries.reduce((total, entry) => total + entry.transferSize, 0),
  };
}

export function formatTileLevels(levels: TileLevelCount[]): string {
  return levels.map(({ level, tiles }) => `L${level}×${tiles}`).join(' ');
}
