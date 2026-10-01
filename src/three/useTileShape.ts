import { useMemo } from 'react';
import * as THREE from 'three';
import { geoToScene, LEVEL_DEPTH } from '../lib/tileGeometry';
import type { TileBounds } from '../types';

export function useTileShape(
  { west, east, south, north, level }: TileBounds & { level: number },
  outlineColor: number,
) {
  const outline = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      geoToScene(west, south, level),
      geoToScene(east, south, level),
      geoToScene(east, north, level),
      geoToScene(west, north, level),
      geoToScene(west, south, level),
    ]);

    return new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: outlineColor }));
  }, [west, east, south, north, level, outlineColor]);

  return {
    outline,
    center: { x: (west + east) / 2, y: (south + north) / 2, z: -level * LEVEL_DEPTH },
    size: [east - west, north - south] as const,
  };
}
