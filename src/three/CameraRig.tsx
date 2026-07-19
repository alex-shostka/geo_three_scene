import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useTiles } from '../state/TilesContext';
import { LEVEL_DEPTH } from '../lib/tileGeometry';

/** Positions the Three.js camera so that all currently-rendered tiles fit in the frame. */
export function CameraRig() {
  const { focusBounds, tiles } = useTiles();
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as OrbitControlsImpl | null;

  const tilesRef = useRef(tiles);
  useEffect(() => { tilesRef.current = tiles; }, [tiles]);

  // Cesium's tileLoadProgressEvent fires focusBounds updates ambiently (on every
  // globe tile load, unrelated to this scene). Once the user has taken manual
  // control of OrbitControls, those ambient updates must stop re-centering the
  // camera mid-scroll — only an explicit navigation (level-list click, tagged
  // `manual`) should still move it.
  const userTouchedRef = useRef(false);

  useEffect(() => {
    if (!controls) return;
    // Re-pivot onto the deepest currently-rendered level at the start of every
    // user gesture (drag or wheel tick), so a level-list jump to a shallower
    // level doesn't leave OrbitControls' target — and thus its dolly-in limit —
    // stuck short of tiles that have since loaded deeper. Only target.z moves;
    // camera.position is untouched, so nothing visually jumps.
    const onStart = () => {
      userTouchedRef.current = true;
      let maxLevel = -Infinity;
      tilesRef.current.forEach((tile) => { if (tile.level > maxLevel) maxLevel = tile.level; });
      if (maxLevel === -Infinity) return;
      controls.target.z = -maxLevel * LEVEL_DEPTH;
      controls.update();
    };
    controls.addEventListener('start', onStart);
    return () => controls.removeEventListener('start', onStart);
  }, [controls]);

  useEffect(() => {
    if (!focusBounds || !controls) return;
    if (userTouchedRef.current && !focusBounds.manual) return;

    const { centerLon, centerLat, span, tileZ, zRange } = focusBounds;
    const fovRad = ((camera as THREE.PerspectiveCamera).fov * Math.PI) / 180;
    const xyDist = ((span / 2) / Math.tan(fovRad / 2)) * 1.4;
    // tileZ now targets the deepest rendered level; add zRange so the camera
    // still starts out in front of the shallowest level, matching the old framing.
    const dist = xyDist + zRange;

    controls.target.set(centerLon, centerLat, tileZ);
    camera.position.set(centerLon, centerLat, tileZ + dist);
    controls.update();
  }, [focusBounds, camera, controls]);

  return null;
}
