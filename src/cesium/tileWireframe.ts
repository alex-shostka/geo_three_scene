import { Cartesian2, Cartesian3, Color, LabelCollection, LabelStyle, Rectangle, type Viewer } from 'cesium';
import { tileKey } from '../lib/tileKey';

interface RenderedTile {
  level: number;
  x: number;
  y: number;
  rectangle: Rectangle;
  data?: { renderedMesh?: { indices: ArrayLike<number>; indexCountWithoutSkirts: number } };
}

interface GlobeWithDebugSurface {
  _surface?: {
    _tilesToRender?: RenderedTile[];
    tileProvider?: { _debug?: { wireframe: boolean } };
  };
}

export interface TileTriangles {
  key: string;
  level: number;
  center: { longitude: number; latitude: number };
  triangles: number;
  skirtTriangles: number;
}

function debugSurface(viewer: Viewer) {
  return (viewer.scene.globe as unknown as GlobeWithDebugSurface)._surface;
}

export function readRenderedTiles(viewer: Viewer): TileTriangles[] {
  const tiles = debugSurface(viewer)?._tilesToRender ?? [];

  return tiles.flatMap((tile) => {
    const mesh = tile.data?.renderedMesh;

    if (!mesh) {
      return [];
    }

    const center = Rectangle.center(tile.rectangle);

    return {
      key: tileKey(tile.level, tile.x, tile.y),
      level: tile.level,
      center: { longitude: center.longitude, latitude: center.latitude },
      triangles: Math.floor(mesh.indices.length / 3),
      skirtTriangles: Math.floor((mesh.indices.length - mesh.indexCountWithoutSkirts) / 3),
    };
  });
}

function setWireframe(viewer: Viewer, enabled: boolean) {
  const debug = debugSurface(viewer)?.tileProvider?._debug;

  if (!debug) {
    return;
  }

  debug.wireframe = enabled;
  viewer.scene.requestRender();
}

export function showTileTriangleGrid(viewer: Viewer): () => void {
  const labels = new LabelCollection();

  viewer.scene.primitives.add(labels);
  let shownKeys = '';

  const updateLabels = () => {
    const tiles = readRenderedTiles(viewer);
    const keys = tiles.map((tile) => tile.key).join(',');

    if (keys === shownKeys) {
      return;
    }

    shownKeys = keys;
    labels.removeAll();
    tiles.forEach((tile) => {
      labels.add({
        position: Cartesian3.fromRadians(tile.center.longitude, tile.center.latitude),
        text: `L${tile.level} · ${tile.triangles}\n(${tile.skirtTriangles} skirt)`,
        font: '600 13px -apple-system, BlinkMacSystemFont, sans-serif',
        fillColor: Color.WHITE,
        outlineColor: Color.BLACK,
        outlineWidth: 3,
        style: LabelStyle.FILL_AND_OUTLINE,
        showBackground: true,
        backgroundColor: Color.BLACK.withAlpha(0.55),
        backgroundPadding: new Cartesian2(6, 4),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      });
    });
  };

  setWireframe(viewer, true);
  const removePostRender = viewer.scene.postRender.addEventListener(updateLabels);

  return () => {
    removePostRender();
    viewer.scene.primitives.remove(labels);
    setWireframe(viewer, false);
  };
}
