import { useSyncExternalStore } from 'react';
import { Cartesian3, type Viewer } from 'cesium';
import type { TileBounds } from '../types';

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

export function useViewer(): Viewer | null {
  return useSyncExternalStore(subscribe, getViewer);
}

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
