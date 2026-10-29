import { Math as CesiumMath } from 'cesium';
import { useEffect, useState } from 'react';
import type { CameraPose } from '../types';
import { useViewer } from './viewerStore';

const UPDATE_INTERVAL_MS = 100;

export function useCameraPose(): CameraPose | null {
  const [pose, setPose] = useState<CameraPose | null>(null);
  const viewer = useViewer();

  useEffect(() => {
    if (!viewer) {
      return;
    }

    let lastUpdate = 0;
    const update = () => {
      const now = performance.now();

      if (now - lastUpdate < UPDATE_INTERVAL_MS) {
        return;
      }

      const carto = viewer.camera.positionCartographic;
      let rollDeg = CesiumMath.toDegrees(viewer.camera.roll);

      lastUpdate = now;

      if (rollDeg > 180) {
        rollDeg -= 360;
      }

      setPose({
        height: carto.height,
        lon: CesiumMath.toDegrees(carto.longitude),
        lat: CesiumMath.toDegrees(carto.latitude),
        heading: CesiumMath.toDegrees(viewer.camera.heading),
        pitch: CesiumMath.toDegrees(viewer.camera.pitch),
        roll: rollDeg,
      });
    };

    update();
    viewer.scene.postRender.addEventListener(update);

    return () => {
      viewer.scene.postRender.removeEventListener(update);
    };
  }, [viewer]);

  return pose;
}
