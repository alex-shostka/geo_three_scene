import { Cartographic, type UrlTemplateImageryProvider, type Viewer } from 'cesium';
import { useCallback, useRef, useState } from 'react';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { collectUserData, type UserDataEntry } from '../lib/collectUserData';
import { disposeGltf } from '../lib/disposeGltf';
import { parseStructuralMetadata } from '../lib/parseStructuralMetadata';
import { rectRadiansToDegrees } from '../lib/tileGeometry';
import { tileKey } from '../lib/tileKey';
import { buildTileUrl, GLB_TILES_URL_TEMPLATE } from '../lib/tileUrl';
import type { GlbMetadata, GlbTileInfo } from '../types';

export interface GlbEntry {
  info: GlbTileInfo;
  metadata: GlbMetadata | null;
  userData: UserDataEntry[];
}

const GLB_LEVELS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export function useGlbTiles(localTiles: UrlTemplateImageryProvider) {
  const [loader] = useState(() => new GLTFLoader());
  const loadedGlbsRef = useRef<Map<string, GlbEntry | null>>(new Map());

  const loadGlbTile = useCallback(
    (z: number, x: number, y: number) => {
      const key = tileKey(z, x, y);
      const loadedGlbs = loadedGlbsRef.current;

      if (loadedGlbs.has(key)) {
        return;
      }

      loadedGlbs.set(key, null);

      const rect = localTiles.tilingScheme.tileXYToRectangle(x, y, z);
      const info: GlbTileInfo = {
        z,
        x,
        y,
        ...rectRadiansToDegrees(rect),
        url: buildTileUrl(GLB_TILES_URL_TEMPLATE, z, x, y),
      };

      loader.load(
        info.url,
        async (gltf) => {
          const metadata = await parseStructuralMetadata(gltf);
          const userData = metadata ? [] : collectUserData(gltf.scene);

          disposeGltf(gltf);
          loadedGlbs.set(key, { info, metadata, userData });
        },

        undefined,
        () => {
          loadedGlbs.delete(key);
        },
      );
    },
    [localTiles, loader],
  );

  const loadGlbForViewport = useCallback(
    (viewer: Viewer) => {
      const rect = viewer.camera.computeViewRectangle();

      if (!rect) {
        return;
      }

      const scheme = localTiles.tilingScheme;

      GLB_LEVELS.forEach((level) => {
        const nw = scheme.positionToTileXY(new Cartographic(rect.west, rect.north), level);
        const se = scheme.positionToTileXY(new Cartographic(rect.east, rect.south), level);

        if (!nw || !se) {
          return;
        }

        if ((se.x - nw.x + 1) * (se.y - nw.y + 1) > 200) {
          return;
        }

        for (let tx = nw.x; tx <= se.x; tx++) {
          for (let ty = nw.y; ty <= se.y; ty++) {
            loadGlbTile(level, tx, ty);
          }
        }
      });
    },
    [localTiles, loadGlbTile],
  );

  return { loadedGlbsRef, loadGlbForViewport };
}
