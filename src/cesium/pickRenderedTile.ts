import { Cartesian2, Cartographic, type Viewer } from 'cesium';

export interface QuadtreeTileLike {
  level: number;
  x: number;
  y: number;
  rectangle: { west: number; east: number; south: number; north: number };
}

/** Cesium doesn't expose rendered-tile lookup publicly — `_surface._tilesToRender` is the same
 *  private field the original implementation relied on. */
export function getRenderedTiles(viewer: Viewer): QuadtreeTileLike[] {
  return (viewer.scene.globe as any)._surface?._tilesToRender ?? [];
}

export function pickRenderedTile(viewer: Viewer, offsetX: number, offsetY: number): QuadtreeTileLike | null {
  const carto = viewer.camera.pickEllipsoid(
    new Cartesian2(offsetX, offsetY),
    viewer.scene.globe.ellipsoid,
  );
  if (!carto) return null;

  const cartographic = Cartographic.fromCartesian(carto);
  const tiles = getRenderedTiles(viewer);
  return tiles.find((t) => {
    const r = t.rectangle;
    return cartographic.longitude >= r.west && cartographic.longitude <= r.east &&
           cartographic.latitude >= r.south && cartographic.latitude <= r.north;
  }) ?? null;
}
