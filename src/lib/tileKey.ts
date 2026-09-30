export const ERROR_TILE_KEY_PREFIX = 'err:';

export function tileKey(level: number, x: number, y: number): string {
  return `${level}/${x}/${y}`;
}

export function errorTileKey(level: number, x: number, y: number): string {
  return `${ERROR_TILE_KEY_PREFIX}${tileKey(level, x, y)}`;
}
