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
  let minLevel = Infinity, maxLevel = -Infinity;

  tiles.forEach((tile) => {
    const { west, east, south, north } = rectRadiansToDegrees(tile.rectangle);
    if (west < minLon) minLon = west;
    if (east > maxLon) maxLon = east;
    if (south < minLat) minLat = south;
    if (north > maxLat) maxLat = north;
    if (tile.level < minLevel) minLevel = tile.level;
    if (tile.level > maxLevel) maxLevel = tile.level;
  });

  // Each zoom level sits on its own Z-plane (see geoToScene), and OrbitControls
  // can only dolly up to its target — never past it. Targeting the shallowest
  // level (as before) left every deeper, more distant level permanently out of
  // scroll reach, so we target the deepest rendered level instead; zRange lets
  // CameraRig still start the camera in front of the shallowest level, keeping
  // the initial "see everything" framing unchanged.
  return {
    centerLon: (minLon + maxLon) / 2,
    centerLat: (minLat + maxLat) / 2,
    span: Math.max(maxLon - minLon, maxLat - minLat),
    tileZ: -maxLevel * LEVEL_DEPTH,
    zRange: (maxLevel - minLevel) * LEVEL_DEPTH,
  };
}

/**
 * Focus bounds for jumping straight to one specific rendered level (level-list
 * click). Unlike computeFocusBounds, target IS that level's own plane, so
 * zRange is 0 — the camera settles right in front of just that level's tiles.
 */
export function computeLevelFocusBounds(
  tiles: Iterable<TileBounds & { level: number }>,
  level: number,
): FocusBounds | null {
  let west = Infinity, east = -Infinity;
  let south = Infinity, north = -Infinity;
  let found = false;

  for (const tile of tiles) {
    if (tile.level !== level) continue;
    found = true;
    if (tile.west < west) west = tile.west;
    if (tile.east > east) east = tile.east;
    if (tile.south < south) south = tile.south;
    if (tile.north > north) north = tile.north;
  }
  if (!found) return null;

  return {
    centerLon: (west + east) / 2,
    centerLat: (south + north) / 2,
    span: Math.max(east - west, north - south) || 0.01,
    tileZ: -level * LEVEL_DEPTH,
    zRange: 0,
    manual: true,
  };
}
