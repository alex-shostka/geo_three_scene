import { useEffect, useRef } from 'react';
import {
  Viewer, Cartesian3, Cartesian2, Cartographic,
  ImageryLayer, TileCoordinatesImageryProvider,
  Rectangle, Color, type Entity,
} from 'cesium';
import { AMSTERDAM, HOME_HEIGHT, createLocalTilesProvider } from './cesiumConfig';
import { useGlbTiles, type GlbEntry } from './useGlbTiles';
import { getRenderedTiles, pickRenderedTile } from './pickRenderedTile';
import { useSettings } from '../state/SettingsContext';
import { useTiles } from '../state/TilesContext';
import { useCesium } from '../state/CesiumContext';
import { useUi } from '../state/UiContext';
import { levelColor, rectRadiansToDegrees, computeFocusBounds } from '../lib/tileGeometry';
import { formatMetadataValue } from '../lib/formatMetadataValue';
import { formatTileError } from '../lib/formatTileError';
import type { ActiveTileRecord, TileCardSection } from '../types';

export function CesiumGlobe() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const hoverEntityRef = useRef<Entity | null>(null);
  const tileGridLayerRef = useRef<ImageryLayer | null>(null);

  const settings = useSettings();
  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  const { addErrorTile, addActiveTiles, hoveredTile, setHoveredTile, tiles, setFocusBounds } = useTiles();
  const tilesRef = useRef(tiles);
  useEffect(() => { tilesRef.current = tiles; }, [tiles]);

  const { setCesiumHandles } = useCesium();
  const { openTileCard } = useUi();
  const openTileCardRef = useRef(openTileCard);
  useEffect(() => { openTileCardRef.current = openTileCard; }, [openTileCard]);

  const localTilesRef = useRef(createLocalTilesProvider());
  const localTiles = localTilesRef.current;
  const { loadedGlbsRef, loadGlbForViewport } = useGlbTiles(localTiles);

  // ── one-time Cesium viewer setup ────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

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
    viewerRef.current = viewer;
    (window as unknown as { geoThreeScene: unknown }).geoThreeScene = { cesiumViewer: viewer };

    viewer.camera.setView({
      destination: Cartesian3.fromDegrees(AMSTERDAM.lon, AMSTERDAM.lat, HOME_HEIGHT),
    });

    const hoverEntity = viewer.entities.add({
      show: false,
      rectangle: {
        coordinates: Rectangle.fromDegrees(0, 0, 1, 1), // placeholder
        material: Color.YELLOW.withAlpha(0.3),
        outline: true,
        outlineColor: Color.YELLOW,
        outlineWidth: 2,
        height: 0,
      },
    });
    hoverEntityRef.current = hoverEntity;

    const glbHoverOutline = viewer.entities.add({
      show: false,
      polyline: {
        positions: [],
        width: 4,
        material: Color.CYAN.withAlpha(0.9),
        clampToGround: true,
      },
    });

    setCesiumHandles({ viewer, hoverEntity });

    // ── error tiles → Three-side error grid (via TilesContext) ───────────────
    localTiles.errorEvent.addEventListener((err: any) => {
      if (err.x == null || err.y == null || err.level == null) return;
      err.retry = false;

      const key = `err:${err.level}/${err.x}/${err.y}`;
      const rect = localTiles.tilingScheme.tileXYToRectangle(err.x, err.y, err.level);
      const { west, east, south, north } = rectRadiansToDegrees(rect);
      const tileUrl = localTiles.url
        .replace('{z}', String(err.level)).replace('{x}', String(err.x)).replace('{y}', String(err.y));
      const errorMsg = formatTileError(err.error);

      addErrorTile({ type: 'error', key, level: err.level, x: err.x, y: err.y, west, east, south, north, tileUrl, errorMsg });
    });

    // ── active tile grid + camera focus + GLB viewport loading ───────────────
    viewer.scene.globe.tileLoadProgressEvent.addEventListener((queueLength: number) => {
      if (queueLength !== 0) return;
      const renderedTiles = getRenderedTiles(viewer);
      if (!renderedTiles.length) return;

      const records: ActiveTileRecord[] = renderedTiles.map((tile) => {
        const { west, east, south, north } = rectRadiansToDegrees(tile.rectangle);
        return {
          type: 'active',
          key: `${tile.level}/${tile.x}/${tile.y}`,
          level: tile.level, x: tile.x, y: tile.y,
          west, east, south, north,
          baseColor: levelColor(tile.level),
        };
      });
      addActiveTiles(records);
      setFocusBounds(computeFocusBounds(renderedTiles));
      if (settingsRef.current.glbTiles) loadGlbForViewport(viewer);
    });

    // ── GLB metadata hover outline (cyan) ─────────────────────────────────────
    let lastHoveredCesiumTileKey: string | null = null;
    const handleGlbHoverMove = (e: MouseEvent) => {
      if (!settingsRef.current.glbMetadata) {
        if (glbHoverOutline.show) { glbHoverOutline.show = false; lastHoveredCesiumTileKey = null; }
        return;
      }
      const hit = pickRenderedTile(viewer, e.offsetX, e.offsetY);
      if (!hit) { glbHoverOutline.show = false; lastHoveredCesiumTileKey = null; return; }

      const key = `${hit.level}/${hit.x}/${hit.y}`;
      if (key === lastHoveredCesiumTileKey) return;
      lastHoveredCesiumTileKey = key;

      const r = hit.rectangle;
      glbHoverOutline.polyline!.positions = Cartesian3.fromRadiansArray([
        r.west, r.south, r.east, r.south, r.east, r.north, r.west, r.north, r.west, r.south,
      ]) as any;
      glbHoverOutline.show = true;
    };
    const handleGlbHoverLeave = () => {
      glbHoverOutline.show = false;
      lastHoveredCesiumTileKey = null;
    };
    viewer.canvas.addEventListener('mousemove', handleGlbHoverMove);
    viewer.canvas.addEventListener('mouseleave', handleGlbHoverLeave);

    // ── tile card click (GLB metadata lookup) ─────────────────────────────────
    const handleClick = (e: MouseEvent) => {
      if (!settingsRef.current.glbMetadata) return;

      const carto = viewer.camera.pickEllipsoid(
        new Cartesian2(e.offsetX, e.offsetY),
        viewer.scene.globe.ellipsoid,
      );
      if (!carto) return;
      const cartographic = Cartographic.fromCartesian(carto);
      const lon = (cartographic.longitude * 180) / Math.PI;
      const lat = (cartographic.latitude * 180) / Math.PI;

      const hit = pickRenderedTile(viewer, e.offsetX, e.offsetY);
      if (!hit) return;
      const title = `${hit.level} / ${hit.x} / ${hit.y}`;

      // GLBs use WebMercator coords — different scheme from Cesium globe tiles,
      // so we match by geographic position, not by key.
      const matchingGlbs: GlbEntry[] = [];
      loadedGlbsRef.current.forEach((entry) => {
        if (!entry) return;
        const { info } = entry;
        if (lon >= info.west && lon <= info.east && lat >= info.south && lat <= info.north) {
          matchingGlbs.push(entry);
        }
      });

      if (!matchingGlbs.length) {
        openTileCardRef.current(title, [], 'No GLB loaded for this point');
        return;
      }

      // Pick the GLB whose zoom level is closest to the current camera level.
      const best = matchingGlbs.reduce((a, b) =>
        Math.abs(a.info.z - hit.level) <= Math.abs(b.info.z - hit.level) ? a : b);

      const sections: TileCardSection[] = [{
        rows: [
          ['url', best.info.url],
          ['west', String(best.info.west)],
          ['east', String(best.info.east)],
          ['south', String(best.info.south)],
          ['north', String(best.info.north)],
        ],
      }];

      if (best.metadata) {
        // Primary: EXT_structural_metadata parsed from binary buffers.
        sections.push({
          rows: Object.entries(best.metadata).map(([k, v]) => [k, formatMetadataValue(k, v)]),
        });
      } else {
        // Fallback: mesh.extras / node.extras via userData, deduped by content.
        const seen = new Set<string>();
        best.model.traverse((obj) => {
          const entries = Object.entries(obj.userData).filter(([k]) => k !== 'glbTileInfo');
          if (!entries.length) return;
          const dedupeKey = JSON.stringify(obj.userData);
          if (seen.has(dedupeKey)) return;
          seen.add(dedupeKey);
          sections.push({ rows: entries.map(([k, v]) => [k, formatMetadataValue(k, v)]) });
        });
      }

      openTileCardRef.current(title, sections);
    };
    viewer.canvas.addEventListener('click', handleClick);

    return () => {
      viewer.canvas.removeEventListener('mousemove', handleGlbHoverMove);
      viewer.canvas.removeEventListener('mouseleave', handleGlbHoverLeave);
      viewer.canvas.removeEventListener('click', handleClick);
      viewer.destroy();
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── "Tile grid on globe" toggle ─────────────────────────────────────────────
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    if (settings.tileGridOnGlobe) {
      if (!tileGridLayerRef.current) {
        tileGridLayerRef.current = viewer.imageryLayers.addImageryProvider(
          new TileCoordinatesImageryProvider({ color: Color.WHITE }),
        );
      }
      tileGridLayerRef.current.show = true;
    } else if (tileGridLayerRef.current) {
      tileGridLayerRef.current.show = false;
    }
  }, [settings.tileGridOnGlobe]);

  // ── "GLB tiles" toggled on → load immediately for the current viewport ─────
  useEffect(() => {
    const viewer = viewerRef.current;
    if (settings.glbTiles && viewer) loadGlbForViewport(viewer);
  }, [settings.glbTiles, loadGlbForViewport]);

  // ── Disabling "active tiles" clears any active-tile hover highlight ────────
  useEffect(() => {
    if (!settings.activeTilesOnScene && hoveredTile?.type === 'active') {
      setHoveredTile(null);
    }
  }, [settings.activeTilesOnScene, hoveredTile, setHoveredTile]);

  // ── Sync R3F hover state → Cesium hover rectangle ───────────────────────────
  useEffect(() => {
    const hoverEntity = hoverEntityRef.current;
    if (!hoverEntity || !hoverEntity.rectangle) return;

    const record = hoveredTile ? tiles.get(hoveredTile.key) : null;
    if (!record) {
      hoverEntity.show = false;
      return;
    }
    hoverEntity.rectangle.coordinates = Rectangle.fromDegrees(
      record.west, record.south, record.east, record.north,
    ) as any;
    hoverEntity.show = true;
  }, [hoveredTile, tiles]);

  return <div id="cesium-container" ref={containerRef} />;
}
