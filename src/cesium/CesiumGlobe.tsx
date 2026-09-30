import { useEffect, useRef, useState } from 'react';
import {
  Viewer,
  Cartesian3,
  Cartesian2,
  Cartographic,
  ImageryLayer,
  TileCoordinatesImageryProvider,
  Rectangle,
  Color,
  ConstantProperty,
  PolylineGraphics,
  type Entity,
  type TileProviderError,
} from 'cesium';
import { AMSTERDAM, HOME_HEIGHT, createLocalTilesProvider } from './cesiumConfig';
import { GLB_TILE_INFO_KEY, useGlbTiles, type GlbEntry } from './useGlbTiles';
import { getRenderedTiles, pickRenderedTile } from './pickRenderedTile';
import { useDoomTile } from './useDoomTile';
import { setViewer } from './viewerStore';
import { levelColor, rectRadiansToDegrees, computeFocusBounds } from '../lib/tileGeometry';
import { formatMetadataValue } from '../lib/formatMetadataValue';
import { formatTileError } from '../lib/formatTileError';
import { errorTileKey, tileKey } from '../lib/tileKey';
import { buildTileUrl } from '../lib/tileUrl';
import { ACTIVE_TILE, ERROR_TILE } from '../constants';
import type { ActiveTileRecord, TileBounds, TileCardSection } from '../types';
import { useAppDispatch, useAppSelector, useAppStore } from '../store/hooks';
import { selectGlbMetadata, selectGlbTiles, selectPlayDoom, selectTileGridOnGlobe } from '../store/settingsSlice';
import { openTileCard } from '../store/uiSlice';
import {
  addActiveTiles,
  addErrorTile,
  selectFirstActiveTile,
  selectHoveredRecord,
  setFocusBounds,
} from '../store/tilesSlice';

const NO_GLB_MESSAGE = 'No GLB loaded for this point';

export function CesiumGlobe() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const hoverEntityRef = useRef<Entity | null>(null);
  const tileGridLayerRef = useRef<ImageryLayer | null>(null);

  const store = useAppStore();
  const tileGridOnGlobe = useAppSelector(selectTileGridOnGlobe);
  const glbTiles = useAppSelector(selectGlbTiles);
  const playDoom = useAppSelector(selectPlayDoom);

  const hoveredRecord = useAppSelector(selectHoveredRecord);
  const firstActiveTile = useAppSelector(selectFirstActiveTile);
  const [doomTileBounds, setDoomTileBounds] = useState<TileBounds | null>(null);

  const dispatch = useAppDispatch();

  const localTilesRef = useRef(createLocalTilesProvider());
  const localTiles = localTilesRef.current;
  const { loadedGlbsRef, loadGlbForViewport } = useGlbTiles(localTiles);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const viewer = new Viewer(containerRef.current, {
      timeline: false,
      animation: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      creditContainer: document.createElement('div'),
      baseLayer: new ImageryLayer(localTiles),
    });

    const hoverEntity = viewer.entities.add({
      show: false,
      rectangle: {
        coordinates: Rectangle.fromDegrees(0, 0, 1, 1),
        material: Color.YELLOW.withAlpha(0.3),
        outline: true,
        outlineColor: Color.YELLOW,
        outlineWidth: 2,
        height: 0,
      },
    });
    const glbHoverPolyline = new PolylineGraphics({
      positions: [],
      width: 4,
      material: Color.CYAN.withAlpha(0.9),
      clampToGround: true,
    });
    const glbHoverOutline = viewer.entities.add({ show: false });
    let lastHoveredCesiumTileKey: string | null = null;
    const handleGlbHoverMove = (event: MouseEvent) => {
      if (!selectGlbMetadata(store.getState())) {
        if (glbHoverOutline.show) {
          glbHoverOutline.show = false;
          lastHoveredCesiumTileKey = null;
        }

        return;
      }

      const hit = pickRenderedTile(viewer, event.offsetX, event.offsetY);

      if (!hit) {
        glbHoverOutline.show = false;
        lastHoveredCesiumTileKey = null;

        return;
      }

      const key = tileKey(hit.level, hit.x, hit.y);

      if (key === lastHoveredCesiumTileKey) {
        return;
      }

      lastHoveredCesiumTileKey = key;

      const r = hit.rectangle;

      glbHoverPolyline.positions = new ConstantProperty(
        Cartesian3.fromRadiansArray([
          r.west,
          r.south,
          r.east,
          r.south,
          r.east,
          r.north,
          r.west,
          r.north,
          r.west,
          r.south,
        ]),
      );
      glbHoverOutline.show = true;
    };
    const handleGlbHoverLeave = () => {
      glbHoverOutline.show = false;
      lastHoveredCesiumTileKey = null;
    };
    const handleClick = (event: MouseEvent) => {
      if (!selectGlbMetadata(store.getState())) {
        return;
      }

      const carto = viewer.camera.pickEllipsoid(
        new Cartesian2(event.offsetX, event.offsetY),
        viewer.scene.globe.ellipsoid,
      );

      if (!carto) {
        return;
      }

      const cartographic = Cartographic.fromCartesian(carto);
      const lon = (cartographic.longitude * 180) / Math.PI;
      const lat = (cartographic.latitude * 180) / Math.PI;

      const hit = pickRenderedTile(viewer, event.offsetX, event.offsetY);

      if (!hit) {
        return;
      }

      const title = `${hit.level} / ${hit.x} / ${hit.y}`;

      const matchingGlbs: GlbEntry[] = [];

      loadedGlbsRef.current.forEach((entry) => {
        if (!entry) {
          return;
        }

        const { info } = entry;

        if (lon >= info.west && lon <= info.east && lat >= info.south && lat <= info.north) {
          matchingGlbs.push(entry);
        }
      });

      if (!matchingGlbs.length) {
        dispatch(openTileCard({ title, sections: [], message: NO_GLB_MESSAGE }));

        return;
      }

      const best = matchingGlbs.reduce((a, b) =>
        Math.abs(a.info.z - hit.level) <= Math.abs(b.info.z - hit.level) ? a : b,
      );

      const sections: TileCardSection[] = [
        {
          rows: [
            ['url', best.info.url],
            ['west', String(best.info.west)],
            ['east', String(best.info.east)],
            ['south', String(best.info.south)],
            ['north', String(best.info.north)],
          ],
        },
      ];

      if (best.metadata) {
        sections.push({
          rows: Object.entries(best.metadata).map(([k, v]) => [k, formatMetadataValue(k, v)]),
        });
      } else {
        const seen = new Set<string>();

        best.model.traverse((obj) => {
          const entries = Object.entries(obj.userData).filter(([k]) => k !== GLB_TILE_INFO_KEY);

          if (!entries.length) {
            return;
          }

          const dedupeKey = JSON.stringify(obj.userData);

          if (seen.has(dedupeKey)) {
            return;
          }

          seen.add(dedupeKey);
          sections.push({ rows: entries.map(([k, v]) => [k, formatMetadataValue(k, v)]) });
        });
      }

      dispatch(openTileCard({ title, sections }));
    };

    glbHoverOutline.polyline = glbHoverPolyline;
    viewerRef.current = viewer;
    hoverEntityRef.current = hoverEntity;
    window.geoThreeScene = { cesiumViewer: viewer };

    viewer.camera.setView({
      destination: Cartesian3.fromDegrees(AMSTERDAM.lon, AMSTERDAM.lat, HOME_HEIGHT),
    });

    setViewer(viewer);

    localTiles.errorEvent.addEventListener((err: TileProviderError) => {
      if (err.x == null || err.y == null || err.level == null) {
        return;
      }

      err.retry = false;

      const key = errorTileKey(err.level, err.x, err.y);
      const rect = localTiles.tilingScheme.tileXYToRectangle(err.x, err.y, err.level);
      const { west, east, south, north } = rectRadiansToDegrees(rect);
      const tileUrl = buildTileUrl(localTiles.url, err.level, err.x, err.y);
      const errorMsg = formatTileError(err.error);

      dispatch(
        addErrorTile({
          type: ERROR_TILE,
          key,
          level: err.level,
          x: err.x,
          y: err.y,
          west,
          east,
          south,
          north,
          tileUrl,
          errorMsg,
        }),
      );
    });

    viewer.scene.globe.tileLoadProgressEvent.addEventListener((queueLength: number) => {
      if (queueLength !== 0) {
        return;
      }

      const renderedTiles = getRenderedTiles(viewer);

      if (!renderedTiles.length) {
        return;
      }

      const records: ActiveTileRecord[] = renderedTiles.map((tile) => {
        const { west, east, south, north } = rectRadiansToDegrees(tile.rectangle);

        return {
          type: ACTIVE_TILE,
          key: tileKey(tile.level, tile.x, tile.y),
          level: tile.level,
          x: tile.x,
          y: tile.y,
          west,
          east,
          south,
          north,
          baseColor: levelColor(tile.level),
        };
      });

      dispatch(addActiveTiles(records));
      dispatch(setFocusBounds(computeFocusBounds(renderedTiles)));

      if (selectGlbTiles(store.getState())) {
        loadGlbForViewport(viewer);
      }
    });

    viewer.canvas.addEventListener('mousemove', handleGlbHoverMove);
    viewer.canvas.addEventListener('mouseleave', handleGlbHoverLeave);
    viewer.canvas.addEventListener('click', handleClick);

    return () => {
      viewer.canvas.removeEventListener('mousemove', handleGlbHoverMove);
      viewer.canvas.removeEventListener('mouseleave', handleGlbHoverLeave);
      viewer.canvas.removeEventListener('click', handleClick);
      setViewer(null);
      viewer.destroy();
      viewerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;

    if (!viewer) {
      return;
    }

    if (tileGridOnGlobe) {
      if (!tileGridLayerRef.current) {
        tileGridLayerRef.current = viewer.imageryLayers.addImageryProvider(
          new TileCoordinatesImageryProvider({ color: Color.WHITE }),
        );
      }

      tileGridLayerRef.current.show = true;
    } else if (tileGridLayerRef.current) {
      tileGridLayerRef.current.show = false;
    }
  }, [tileGridOnGlobe]);

  useEffect(() => {
    const viewer = viewerRef.current;

    if (glbTiles && viewer) {
      loadGlbForViewport(viewer);
    }
  }, [glbTiles, loadGlbForViewport]);

  useEffect(() => {
    const hoverEntity = hoverEntityRef.current;

    if (!hoverEntity || !hoverEntity.rectangle) {
      return;
    }

    if (!hoveredRecord) {
      hoverEntity.show = false;

      return;
    }

    hoverEntity.rectangle.coordinates = new ConstantProperty(
      Rectangle.fromDegrees(hoveredRecord.west, hoveredRecord.south, hoveredRecord.east, hoveredRecord.north),
    );
    hoverEntity.show = true;
  }, [hoveredRecord]);

  useEffect(() => {
    if (!playDoom) {
      setDoomTileBounds(null);

      return;
    }

    if (doomTileBounds) {
      return;
    }

    if (firstActiveTile) {
      setDoomTileBounds(firstActiveTile);
    }
  }, [playDoom, firstActiveTile, doomTileBounds]);
  useDoomTile(viewerRef.current, doomTileBounds);

  return <div id="cesium-container" ref={containerRef} />;
}
