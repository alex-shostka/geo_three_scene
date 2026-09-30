import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useAppSelector, useAppStore } from '../store/hooks';
import { selectAllTiles, selectFocusBounds } from '../store/tilesSlice';
import { LEVEL_DEPTH } from '../lib/tileGeometry';

export function CameraRig() {
  const focusBounds = useAppSelector(selectFocusBounds);
  const store = useAppStore();
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as OrbitControlsImpl | null;

  const userTouchedRef = useRef(false);

  useEffect(() => {
    if (!controls) {
      return;
    }

    const onStart = () => {
      userTouchedRef.current = true;

      let maxLevel = -Infinity;

      selectAllTiles(store.getState()).forEach((tile) => {
        if (tile.level > maxLevel) {
          maxLevel = tile.level;
        }
      });

      if (maxLevel === -Infinity) {
        return;
      }

      controls.target.z = -maxLevel * LEVEL_DEPTH;
      controls.update();
    };

    controls.addEventListener('start', onStart);

    return () => controls.removeEventListener('start', onStart);
  }, [controls, store]);

  useEffect(() => {
    if (!focusBounds || !controls) {
      return;
    }

    if (userTouchedRef.current && !focusBounds.manual) {
      return;
    }

    const { centerLon, centerLat, span, tileZ, zRange } = focusBounds;
    const fovRad = ((camera as THREE.PerspectiveCamera).fov * Math.PI) / 180;
    const xyDist = ((span / 2) / Math.tan(fovRad / 2)) * 1.4;
    const dist = xyDist + zRange;

    controls.target.set(centerLon, centerLat, tileZ);
    camera.position.set(centerLon, centerLat, tileZ + dist);
    controls.update();
  }, [focusBounds, camera, controls]);

  return null;
}
