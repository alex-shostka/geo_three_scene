import type { TileBounds } from '../types';

export function containsPoint(bounds: TileBounds, lon: number, lat: number): boolean {
  return lon >= bounds.west && lon <= bounds.east && lat >= bounds.south && lat <= bounds.north;
}
