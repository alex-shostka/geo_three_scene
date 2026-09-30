import { Cartesian2, Cartographic, type Viewer } from 'cesium';

export interface QuadtreeTileLike {
  level: number;
  x: number;
  y: number;
  rectangle: { west: number; east: number; south: number; north: number };
}

interface GlobeInternals {
  _surface?: { _tilesToRender?: QuadtreeTileLike[] };
}

function hasSurface(globe: object): globe is GlobeInternals {
  return '_surface' in globe;
}

export function getRenderedTiles(viewer: Viewer): QuadtreeTileLike[] {
  const globe = viewer.scene.globe;

  if (!hasSurface(globe)) {
    return [];
  }

  return globe._surface?._tilesToRender ?? [];
}

export function pickRenderedTile(viewer: Viewer, offsetX: number, offsetY: number): QuadtreeTileLike | null {
  const carto = viewer.camera.pickEllipsoid(new Cartesian2(offsetX, offsetY), viewer.scene.globe.ellipsoid);

  if (!carto) {
    return null;
  }

  const cartographic = Cartographic.fromCartesian(carto);
  const tiles = getRenderedTiles(viewer);

  return (
    tiles.find((t) => {
      const r = t.rectangle;

      return (
        cartographic.longitude >= r.west &&
        cartographic.longitude <= r.east &&
        cartographic.latitude >= r.south &&
        cartographic.latitude <= r.north
      );
    }) ?? null
  );
}
