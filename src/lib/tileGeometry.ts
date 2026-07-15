import * as THREE from 'three';
import type { FocusBounds, TileBounds } from '../types';

export const LEVEL_DEPTH = 5;

export const LEVEL_COLORS = [
  0xffffff, 0x4fc3f7, 0x81c784, 0xffb74d,
  0xf06292, 0xba68c8, 0x4dd0e1, 0xdce775,
];

export function levelColor(level: number): number {
  return LEVEL_COLORS[level % LEVEL_COLORS.length];
}

/** Converts geographic coordinates (lon/lat) and tile level into a Three.js position. */
export function geoToScene(lon: number, lat: number, level: number): THREE.Vector3 {
  return new THREE.Vector3(lon, lat, -level * LEVEL_DEPTH);
}

interface RadiansRectangle {
  west: number;
  east: number;
  south: number;
  north: number;
}

/** Converts a Cesium Rectangle (radians) into a TileBounds (degrees). */
export function rectRadiansToDegrees(rect: RadiansRectangle): TileBounds {
  return {
    west: (rect.west * 180) / Math.PI,
    east: (rect.east * 180) / Math.PI,
    south: (rect.south * 180) / Math.PI,
    north: (rect.north * 180) / Math.PI,
  };
}

interface CesiumTileLike {
  level: number;
  rectangle: RadiansRectangle;
}

/**
 * Computes the camera-focus target for a set of Cesium quadtree tiles.
 * Mirrors the bounds-gathering half of the original focusCameraOnTiles —
 * the distance/fov math stays with the camera (CameraRig), since it needs
 * the live camera.fov.
 */
export function computeFocusBounds(tiles: CesiumTileLike[]): FocusBounds | null {
  if (!tiles.length) return null;

  let minLon = Infinity, maxLon = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;
  let minLevel = Infinity;

  tiles.forEach((tile) => {
    const { west, east, south, north } = rectRadiansToDegrees(tile.rectangle);
    if (west < minLon) minLon = west;
    if (east > maxLon) maxLon = east;
    if (south < minLat) minLat = south;
    if (north > maxLat) maxLat = north;
    if (tile.level < minLevel) minLevel = tile.level;
  });

  return {
    centerLon: (minLon + maxLon) / 2,
    centerLat: (minLat + maxLat) / 2,
    span: Math.max(maxLon - minLon, maxLat - minLat),
    tileZ: -minLevel * LEVEL_DEPTH,
  };
}
