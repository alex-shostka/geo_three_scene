import { useEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useTiles } from '../state/TilesContext';

/** Positions the Three.js camera so that all currently-rendered tiles fit in the frame. */
export function CameraRig() {
  const { focusBounds } = useTiles();
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as OrbitControlsImpl | null;

  useEffect(() => {
    if (!focusBounds || !controls) return;
    const { centerLon, centerLat, span, tileZ } = focusBounds;
    const fovRad = ((camera as THREE.PerspectiveCamera).fov * Math.PI) / 180;
    const dist = ((span / 2) / Math.tan(fovRad / 2)) * 1.4;

    controls.target.set(centerLon, centerLat, tileZ);
    camera.position.set(centerLon, centerLat, tileZ + dist);
    controls.update();
  }, [focusBounds, camera, controls]);

  return null;
}
