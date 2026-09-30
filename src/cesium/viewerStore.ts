import { useSyncExternalStore } from 'react';
import { Cartesian3, type Viewer } from 'cesium';
import type { TileBounds } from '../types';

/**
 * Holds the live Cesium Viewer outside Redux: it's a mutable WebGL object, not
 * serializable state. React components subscribe to it via useViewer().
 */
let viewer: Viewer | null = null;
const listeners = new Set<() => void>();

export function setViewer(next: Viewer | null): void {
  viewer = next;
  listeners.forEach((listener) => listener());
}

export function getViewer(): Viewer | null {
  return viewer;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/** Re-renders the component when the Viewer is created or destroyed. */
export function useViewer(): Viewer | null {
  return useSyncExternalStore(subscribe, getViewer);
}

// Keeps the current camera height so zooming out to fly doesn't rebuild the tile grid.
export function flyCameraToTile(bounds: TileBounds): void {
  if (!viewer) {
    return;
  }

  const centerLon = (bounds.west + bounds.east) / 2;
  const centerLat = (bounds.south + bounds.north) / 2;
  const currentHeight = viewer.camera.positionCartographic.height;
  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(centerLon, centerLat, currentHeight),
    duration: 1.5,
  });
}
