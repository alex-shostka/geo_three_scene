import { Rectangle, type Viewer } from 'cesium';
import { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectPlayDoom } from '../store/settingsSlice';
import { selectFirstActiveTile } from '../store/tilesSlice';
import type { TileBounds } from '../types';
import { pickCenterTile } from './pickRenderedTile';

const FLY_DURATION_SECONDS = 1.5;

export function useDoomTarget(viewer: Viewer | null): TileBounds | null {
  const playDoom = useAppSelector(selectPlayDoom);
  const firstActiveTile = useAppSelector(selectFirstActiveTile);
  const [target, setTarget] = useState<TileBounds | null>(null);

  useEffect(() => {
    if (!playDoom) {
      setTarget(null);

      return;
    }

    if (target || !viewer) {
      return;
    }

    const bounds = pickCenterTile(viewer) ?? firstActiveTile;

    if (!bounds) {
      return;
    }

    setTarget(bounds);
    viewer.camera.flyTo({
      destination: Rectangle.fromDegrees(bounds.west, bounds.south, bounds.east, bounds.north),
      duration: FLY_DURATION_SECONDS,
    });
  }, [playDoom, viewer, firstActiveTile, target]);

  return target;
}
