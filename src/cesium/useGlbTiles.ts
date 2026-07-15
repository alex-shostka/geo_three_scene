import { useCallback, useRef } from 'react';
import type { Group } from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { Cartographic, type UrlTemplateImageryProvider, type Viewer } from 'cesium';
import { parseStructuralMetadata } from '../lib/parseStructuralMetadata';
import type { GlbMetadata, GlbTileInfo } from '../types';

export interface GlbEntry {
  gltf: GLTF;
  model: Group;
  info: GlbTileInfo;
  metadata: GlbMetadata | null;
}

const GLB_LEVELS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

/**
 * Loads GLB tiles purely as a metadata source (data-only — nothing is added
 * to the Three.js scene). Kept in a ref rather than React state since no
 * component needs to re-render when a GLB finishes loading.
 */
export function useGlbTiles(localTiles: UrlTemplateImageryProvider) {
  const loaderRef = useRef<GLTFLoader | null>(null);
  if (!loaderRef.current) loaderRef.current = new GLTFLoader();

  const loadedGlbsRef = useRef<Map<string, GlbEntry | null>>(new Map());

  const loadGlbTile = useCallback((z: number, x: number, y: number) => {
    const key = `${z}/${x}/${y}`;
    const loadedGlbs = loadedGlbsRef.current;
    if (loadedGlbs.has(key)) return;
    loadedGlbs.set(key, null); // reserve slot to prevent duplicate fetches

    const rect = localTiles.tilingScheme.tileXYToRectangle(x, y, z);
    const info: GlbTileInfo = {
      z, x, y,
      west: (rect.west * 180) / Math.PI,
      east: (rect.east * 180) / Math.PI,
      south: (rect.south * 180) / Math.PI,
      north: (rect.north * 180) / Math.PI,
      url: `/tiles_glb_meta_ext/${z}/${x}/${y}.glb`,
    };

    loaderRef.current!.load(
      info.url,
      async (gltf) => {
        gltf.scene.userData.glbTileInfo = info;
        const metadata = await parseStructuralMetadata(gltf);
        loadedGlbs.set(key, { gltf, model: gltf.scene, info, metadata });
      },
      undefined,
      () => { loadedGlbs.delete(key); },
    );
  }, [localTiles]);

  /**
   * Loads GLB tiles for all GLB_LEVELS that cover the current camera viewport.
   * Skips any level where the viewport spans more than 200 tiles (too many to load at once).
   */
  const loadGlbForViewport = useCallback((viewer: Viewer) => {
    const rect = viewer.camera.computeViewRectangle();
    if (!rect) return;

    const scheme = localTiles.tilingScheme;
    GLB_LEVELS.forEach((level) => {
      const nw = scheme.positionToTileXY(new Cartographic(rect.west, rect.north), level);
      const se = scheme.positionToTileXY(new Cartographic(rect.east, rect.south), level);
      if (!nw || !se) return;
      if ((se.x - nw.x + 1) * (se.y - nw.y + 1) > 200) return;
      for (let tx = nw.x; tx <= se.x; tx++) {
        for (let ty = nw.y; ty <= se.y; ty++) {
          loadGlbTile(level, tx, ty);
        }
      }
    });
  }, [localTiles, loadGlbTile]);

  return { loadedGlbsRef, loadGlbForViewport };
}
