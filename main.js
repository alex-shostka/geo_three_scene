import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  Viewer, Ion, Cartesian3, Cartesian2, Cartographic,
  UrlTemplateImageryProvider, TileCoordinatesImageryProvider, ImageryLayer,
  Rectangle, Color,
} from 'cesium';

window.CESIUM_BASE_URL = '/cesium';
Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2ZDg4NGM2Yy04ZGI2LTRiMmQtODYzMi0zN2FiNjk2OGZhNTUiLCJpZCI6MjQ3OTkxLCJpYXQiOjE3Mjg4OTk4NDR9.BCXMjcfaozkXi39xo656RKTNAYKHrgw3ARreKCN9i4A';

const AMSTERDAM = { lon: 4.9041, lat: 52.3676 };

// ─── Hamburger menu ──────────────────────────────────────────────────────────

const menuBtn   = document.getElementById('menu-btn');
const sidePanel = document.getElementById('side-panel');

// ─── Tile card ───────────────────────────────────────────────────────────────

const tileCard      = document.getElementById('tile-card');
const tileCardTitle = document.getElementById('tile-card-title');
const tileCardBody  = document.getElementById('tile-card-body');

document.getElementById('tile-card-close').addEventListener('click', () => {
  tileCard.classList.remove('open');
});

function openTileCard(title = 'Tile', bodyHtml = '') {
  tileCardTitle.textContent = title;
  tileCardBody.innerHTML    = bodyHtml;
  tileCard.classList.add('open');
}

menuBtn.addEventListener('click', () => {
  const isOpen = sidePanel.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', isOpen);
});

// ─── Settings ────────────────────────────────────────────────────────────────

export const settings = {
  activeTilesOnScene: false,
  flyToTile: false,
  glbTiles: false,
  glbMetadata: false,
};

const toggleFlyToTile = document.getElementById('toggle-fly-to-tile');

document.getElementById('toggle-active-tiles').addEventListener('change', (e) => {
  settings.activeTilesOnScene = e.target.checked;
  if (!e.target.checked) {
    if (hoveredActiveTile) {
      hoveredActiveTile.fillMesh.material.opacity = 0;
      hoveredActiveTile = null;
    }
    // reset fly-to if active tiles are disabled
    toggleFlyToTile.checked = false;
    toggleFlyToTile.disabled = true;
    settings.flyToTile = false;
  } else {
    toggleFlyToTile.disabled = false;
  }
});

toggleFlyToTile.addEventListener('change', (e) => {
  settings.flyToTile = e.target.checked;
});

// Tile grid layer — created once and shown/hidden via the toggle
let tileGridLayer = null;

document.getElementById('toggle-tile-grid').addEventListener('change', (e) => {
  if (e.target.checked) {
    if (!tileGridLayer) {
      tileGridLayer = cesiumViewer.imageryLayers.addImageryProvider(
        new TileCoordinatesImageryProvider({ color: Color.WHITE }),
      );
    }
    tileGridLayer.show = true;
  } else if (tileGridLayer) {
    tileGridLayer.show = false;
  }
});

// ─── GLB tiles ───────────────────────────────────────────────────────────────

const glbLoader  = new GLTFLoader();
// key `z/x/y` → { gltf, model, info, metadata } — data-only, nothing added to Three.js scene
const loadedGlbs = new Map();

// Reads property values from EXT_structural_metadata binary buffers via gltf.parser.
async function parseStructuralMetadata(gltf) {
  const ext = gltf.parser.json.extensions?.EXT_structural_metadata;
  if (!ext?.propertyTables?.length) return null;

  const table      = ext.propertyTables[0];
  const classProps = ext.schema?.classes?.[table.class]?.properties;
  if (!classProps) return null;

  const result  = {};
  const decoder = new TextDecoder();

  for (const [propName, tableEntry] of Object.entries(table.properties)) {
    const schemaProp = classProps[propName];
    if (!schemaProp) continue;
    try {
      const valuesBV = await gltf.parser.getDependency('bufferView', tableEntry.values);
      if (schemaProp.type === 'STRING') {
        const offsetBV = await gltf.parser.getDependency('bufferView', tableEntry.stringOffsets);
        const offsets  = new Uint32Array(offsetBV);
        const bytes    = new Uint8Array(valuesBV);
        const strings  = [];
        for (let i = 0; i < table.count; i++) {
          strings.push(decoder.decode(bytes.slice(offsets[i], offsets[i + 1])));
        }
        result[propName] = table.count === 1 ? strings[0] : strings;
      } else if (schemaProp.componentType === 'FLOAT32') {
        const floats = new Float32Array(valuesBV);
        result[propName] = table.count === 1 ? floats[0] : Array.from(floats);
      }
    } catch { /* skip property on parse error */ }
  }

  return Object.keys(result).length ? result : null;
}

function loadGlbTile(z, x, y) {
  const key = `${z}/${x}/${y}`;
  if (loadedGlbs.has(key)) return;
  loadedGlbs.set(key, null); // reserve slot to prevent duplicate fetches

  const rect  = localTiles.tilingScheme.tileXYToRectangle(x, y, z);
  const west  = rect.west  * 180 / Math.PI;
  const east  = rect.east  * 180 / Math.PI;
  const south = rect.south * 180 / Math.PI;
  const north = rect.north * 180 / Math.PI;
  const info  = { z, x, y, west, east, south, north, url: `/tiles_glb_meta_ext/${z}/${x}/${y}.glb` };

  glbLoader.load(
    info.url,
    async (gltf) => {
      gltf.scene.userData.glbTileInfo = info;
      const metadata = await parseStructuralMetadata(gltf);
      loadedGlbs.set(key, { gltf, model: gltf.scene, info, metadata });
    },
    undefined,
    () => { loadedGlbs.delete(key); },
  );
}

const GLB_LEVELS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

/**
 * Loads GLB tiles for all GLB_LEVELS that cover the current camera viewport.
 * Uses WebMercator tiling scheme (same as the imagery layer) so tile x/y match the GLB filenames.
 * Skips any level where the viewport spans more than 200 tiles (too many to load at once).
 */
function loadGlbForViewport() {
  const rect = cesiumViewer.camera.computeViewRectangle();
  if (!rect) return;

  const scheme = localTiles.tilingScheme;
  GLB_LEVELS.forEach((level) => {
    const nw = scheme.positionToTileXY(new Cartographic(rect.west, rect.north), level);
    const se = scheme.positionToTileXY(new Cartographic(rect.east, rect.south), level);
    if (!nw || !se) return;
    if ((se.x - nw.x + 1) * (se.y - nw.y + 1) > 200) return;
    for (let tx = nw.x; tx <= se.x; tx++) {
      for (let ty = nw.y; ty <= se.y; ty++) {
        loadGlbTile(level, tx, ty);
      }
    }
  });
}

const toggleGlbMetadata = document.getElementById('toggle-glb-metadata');

document.getElementById('toggle-glb-tiles').addEventListener('change', (e) => {
  settings.glbTiles = e.target.checked;
  if (e.target.checked) {
    loadGlbForViewport();
    toggleGlbMetadata.disabled = false;
  } else {
    toggleGlbMetadata.checked  = false;
    toggleGlbMetadata.disabled = true;
    settings.glbMetadata = false;
  }
});

toggleGlbMetadata.addEventListener('change', (e) => {
  settings.glbMetadata = e.target.checked;
});

// ─── Three.js setup ──────────────────────────────────────────────────────────

const canvas = document.getElementById('three-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(600, 400);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

const camera = new THREE.PerspectiveCamera(60, 600 / 400, 0.1, 10000);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 0.1;
controls.maxDistance = 5000;

const LEVEL_DEPTH = 5;

const LEVEL_COLORS = [
  0xffffff, 0x4fc3f7, 0x81c784, 0xffb74d,
  0xf06292, 0xba68c8, 0x4dd0e1, 0xdce775,
];

const tileGroup = new THREE.Group();
scene.add(tileGroup);

/** Keys of tiles already added to the scene — prevents duplication */
const seenTiles = new Set();

/**
 * Stores data about error tiles for hover logic.
 * key = `err:level/x/y`, value = { mesh, west, east, south, north } (in degrees)
 */
const errorTileData = new Map();

/**
 * Stores data about active scene tiles for hover logic.
 * key = `level/x/y`, value = { hitMesh, fillMesh, lineMat, baseColor, west, east, south, north, level, x, y }
 */
const activeTileData = new Map();

// ─── Cesium setup ─────────────────────────────────────────────────────────────

const localTiles = new UrlTemplateImageryProvider({
  url: '/tiles/{z}/{x}/{y}.png',
  minimumLevel: 0,
  maximumLevel: 15,
  credit: 'OpenStreetMap contributors',
});

const cesiumViewer = new Viewer('cesium-container', {
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

window.geoThreeScene = { cesiumViewer };

cesiumViewer.camera.setView({
  destination: Cartesian3.fromDegrees(AMSTERDAM.lon, AMSTERDAM.lat, 50000),
});

// ─── Cesium tile hover (GLB metadata border) ─────────────────────────────────

const glbHoverOutline = cesiumViewer.entities.add({
  show: false,
  polyline: {
    positions: [],
    width: 4,
    material: Color.CYAN.withAlpha(0.9),
    clampToGround: true,
  },
});

let lastHoveredCesiumTileKey = null;

cesiumViewer.canvas.addEventListener('mousemove', (e) => {
  if (!settings.glbMetadata) {
    if (glbHoverOutline.show) {
      glbHoverOutline.show = false;
      lastHoveredCesiumTileKey = null;
    }
    return;
  }

  const carto = cesiumViewer.camera.pickEllipsoid(
    new Cartesian2(e.offsetX, e.offsetY),
    cesiumViewer.scene.globe.ellipsoid,
  );
  if (!carto) {
    glbHoverOutline.show = false;
    lastHoveredCesiumTileKey = null;
    return;
  }

  const cartographic = Cartographic.fromCartesian(carto);
  const tiles = cesiumViewer.scene.globe._surface._tilesToRender ?? [];
  const hit = tiles.find((t) => {
    const r = t.rectangle;
    return cartographic.longitude >= r.west  && cartographic.longitude <= r.east &&
           cartographic.latitude  >= r.south && cartographic.latitude  <= r.north;
  });

  if (!hit) {
    glbHoverOutline.show = false;
    lastHoveredCesiumTileKey = null;
    return;
  }

  const key = `${hit.level}/${hit.x}/${hit.y}`;
  if (key === lastHoveredCesiumTileKey) return;
  lastHoveredCesiumTileKey = key;

  const r = hit.rectangle;
  glbHoverOutline.polyline.positions = Cartesian3.fromRadiansArray([
    r.west,  r.south,
    r.east,  r.south,
    r.east,  r.north,
    r.west,  r.north,
    r.west,  r.south,
  ]);
  glbHoverOutline.show = true;
});

cesiumViewer.canvas.addEventListener('mouseleave', () => {
  glbHoverOutline.show = false;
  lastHoveredCesiumTileKey = null;
});

// ─── Cesium tile click ────────────────────────────────────────────────────────

cesiumViewer.canvas.addEventListener('click', (e) => {
  const carto = cesiumViewer.camera.pickEllipsoid(
    new Cartesian2(e.offsetX, e.offsetY),
    cesiumViewer.scene.globe.ellipsoid,
  );
  if (!carto) return;

  const cartographic = Cartographic.fromCartesian(carto);
  const lon = cartographic.longitude * 180 / Math.PI;
  const lat = cartographic.latitude  * 180 / Math.PI;

  const tiles = cesiumViewer.scene.globe._surface._tilesToRender ?? [];
  const hit = tiles.find((t) => {
    const r = t.rectangle;
    return cartographic.longitude >= r.west  && cartographic.longitude <= r.east &&
           cartographic.latitude  >= r.south && cartographic.latitude  <= r.north;
  });

  if (!hit) {
    console.log('[tile] no rendered tile at', lon.toFixed(5), lat.toFixed(5));
    return;
  }

  const r = hit.rectangle;
  console.group(`[cesium tile] ${hit.level}/${hit.x}/${hit.y} (GeographicScheme)`);
  console.log('lon/lat clicked:', lon.toFixed(5), lat.toFixed(5));
  console.log('bounds (deg):', {
    west:  (r.west  * 180 / Math.PI).toFixed(5),
    east:  (r.east  * 180 / Math.PI).toFixed(5),
    south: (r.south * 180 / Math.PI).toFixed(5),
    north: (r.north * 180 / Math.PI).toFixed(5),
  });
  console.log('cesium tile:', hit);

  // Find all loaded GLBs whose geographic bounds contain the clicked point.
  // GLBs use WebMercator coords — different scheme from Cesium globe tiles,
  // so we match by position, not by key.
  const matchingGlbs = [];
  for (const entry of loadedGlbs.values()) {
    if (!entry) continue;
    const info = entry.model.userData.glbTileInfo;
    if (lon >= info.west && lon <= info.east && lat >= info.south && lat <= info.north) {
      matchingGlbs.push(entry);
    }
  }

  console.log(`loadedGlbs total: ${loadedGlbs.size} | matching this point: ${matchingGlbs.length}`);

  if (matchingGlbs.length && settings.glbMetadata) {
    let bodyHtml = '';

    // Pick the GLB whose zoom level is closest to the current camera level
    const best = matchingGlbs.reduce((a, b) =>
      Math.abs(a.info.z - hit.level) <= Math.abs(b.info.z - hit.level) ? a : b,
    );

    [best].forEach(({ gltf, model, info }) => {
      bodyHtml += `<div class="tc-mesh"><table class="tc-table">`;
      [['url', info.url], ['west', info.west], ['east', info.east], ['south', info.south], ['north', info.north]].forEach(([k, v]) => {
        bodyHtml += `<tr><td class="tc-key">${k}</td><td class="tc-val">${v}</td></tr>`;
      });
      bodyHtml += `</table></div>`;
      console.group(`glb ${info.z}/${info.x}/${info.y} (WebMercator)`);
      console.log('tile info:', info);
      console.log('gltf:', gltf);
      console.log('animations:', gltf.animations);
      console.log('asset:', gltf.asset);

      const meshes = [];
      model.traverse((obj) => { if (obj.isMesh) meshes.push(obj); });
      console.log(`meshes (${meshes.length}):`, meshes);

      meshes.forEach((m, i) => {
        const geo = m.geometry;
        console.group(`mesh[${i}] "${m.name}"`);
        console.log('material:', m.material);
        console.log('geometry attributes:', Object.fromEntries(
          Object.entries(geo.attributes).map(([k, a]) => [k, { count: a.count, itemSize: a.itemSize }]),
        ));
        if (geo.index) console.log('indexed faces:', geo.index.count / 3);
        console.log('userData:', m.userData);
        console.groupEnd();
      });

      const formatVal = (k, v) => {
        if (k === 'createTime' && typeof v === 'string') {
          return new Date(v).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
        return typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v);
      };

      if (best.metadata) {
        // Primary: EXT_structural_metadata parsed from binary buffers
        bodyHtml += `<div class="tc-mesh"><table class="tc-table">`;
        Object.entries(best.metadata).forEach(([k, v]) => {
          bodyHtml += `<tr><td class="tc-key">${k}</td><td class="tc-val">${formatVal(k, v)}</td></tr>`;
        });
        bodyHtml += `</table></div>`;
      } else {
        // Fallback: mesh.extras / node.extras via userData
        const seen = new Set();
        model.traverse((obj) => {
          const entries = Object.entries(obj.userData).filter(([k]) => k !== 'glbTileInfo');
          if (!entries.length) return;
          const dedupeKey = JSON.stringify(obj.userData);
          if (seen.has(dedupeKey)) return;
          seen.add(dedupeKey);
          bodyHtml += `<div class="tc-mesh"><table class="tc-table">`;
          entries.forEach(([k, v]) => {
            bodyHtml += `<tr><td class="tc-key">${k}</td><td class="tc-val">${formatVal(k, v)}</td></tr>`;
          });
          bodyHtml += `</table></div>`;
        });
      }
      console.groupEnd();
    });

    if (!bodyHtml) bodyHtml = '<span class="tc-empty">userData is empty</span>';
    openTileCard(`${hit.level} / ${hit.x} / ${hit.y}`, bodyHtml);
  } else if (settings.glbMetadata) {
    openTileCard(`${hit.level} / ${hit.x} / ${hit.y}`, '<span class="tc-empty">No GLB loaded for this point</span>');
    console.log('glb: no loaded GLB covers this point (toggle enabled?', settings.glbTiles, ')');
  } else {
    console.log('glb: no loaded GLB covers this point (toggle enabled?', settings.glbTiles, ')');
  }

  console.groupEnd();
});

// ─── Cesium hover entity ──────────────────────────────────────────────────────

/**
 * A single reusable entity for highlighting a tile on the globe.
 * We only change its `rectangle.coordinates` on each hover.
 */
const hoverEntity = cesiumViewer.entities.add({
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

// ─── Tile error handling ─────────────────────────────────────────────────────

/**
 * When Cesium fails to load a tile (404, etc.) — draw a red square
 * in the Three.js scene and store its data for hover.
 */
localTiles.errorEvent.addEventListener((err) => {
  if (err.x == null || err.y == null || err.level == null) return;
  err.retry = false;

  const key = `err:${err.level}/${err.x}/${err.y}`;
  if (seenTiles.has(key)) return;
  seenTiles.add(key);

  const rect  = localTiles.tilingScheme.tileXYToRectangle(err.x, err.y, err.level);
  const west  = rect.west  * 180 / Math.PI;
  const east  = rect.east  * 180 / Math.PI;
  const south = rect.south * 180 / Math.PI;
  const north = rect.north * 180 / Math.PI;
  const z     = -err.level * LEVEL_DEPTH;

  // Filled red square (only the Mesh participates in raycasting)
  const mat = new THREE.MeshBasicMaterial({
    color: 0xff2222,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(east - west, north - south), mat);
  mesh.position.set((west + east) / 2, (south + north) / 2, z);
  mesh.userData.errorTileKey = key;   // marker for the raycaster
  tileGroup.add(mesh);

  // Red outline on top
  const pts = [
    new THREE.Vector3(west, south, z + 0.01),
    new THREE.Vector3(east, south, z + 0.01),
    new THREE.Vector3(east, north, z + 0.01),
    new THREE.Vector3(west, north, z + 0.01),
    new THREE.Vector3(west, south, z + 0.01),
  ];
  tileGroup.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0xff0000 }),
  ));

  const tileUrl = localTiles.url
    .replace('{z}', err.level).replace('{x}', err.x).replace('{y}', err.y);
  const errorMsg = err.error?.message ?? err.error ?? 'unknown';

  // Store data for hover
  errorTileData.set(key, { mesh, west, east, south, north, level: err.level, x: err.x, y: err.y, tileUrl, errorMsg });
  updateHud();
});

// ─── HUD + Tooltip ───────────────────────────────────────────────────────────

const hudCount   = document.getElementById('hud-count');
const hudEl      = document.getElementById('tile-hud');
const tooltip    = document.getElementById('tile-tooltip');

function updateHud() {
  const n = errorTileData.size;
  hudCount.textContent = n;
  hudEl.classList.toggle('has-errors', n > 0);
}

function showTooltip(e, data) {
  const widthKm  = (data.east  - data.west)  * 111 * Math.cos(((data.south + data.north) / 2) * Math.PI / 180);
  const heightKm = (data.north - data.south) * 111;
  const centerLon = ((data.west  + data.east)  / 2).toFixed(4);
  const centerLat = ((data.south + data.north) / 2).toFixed(4);

  tooltip.innerHTML =
    `<span class="tt-path">/${data.level}/${data.x}/${data.y}</span>\n` +
    `<span class="tt-label">url   </span><span class="tt-url">${data.tileUrl}</span>\n` +
    `<span class="tt-label">error </span><span class="tt-error">${data.errorMsg}</span>\n` +
    `<span class="tt-label">lon   </span><span class="tt-value">${data.west.toFixed(4)}° … ${data.east.toFixed(4)}°  (center ${centerLon}°)</span>\n` +
    `<span class="tt-label">lat   </span><span class="tt-value">${data.south.toFixed(4)}° … ${data.north.toFixed(4)}°  (center ${centerLat}°)</span>\n` +
    `<span class="tt-label">size  </span><span class="tt-value">${widthKm.toFixed(1)} × ${heightKm.toFixed(1)} km</span>\n` +
    `<span class="tt-label">zoom  </span><span class="tt-value">${data.level}</span>`;

  tooltip.style.display = 'block';
  moveTooltip(e);
}

function moveTooltip(e) {
  const offset = 16;
  const tw = tooltip.offsetWidth;
  const th = tooltip.offsetHeight;
  let x = e.clientX + offset;
  let y = e.clientY + offset;
  if (x + tw > window.innerWidth  - 8) x = e.clientX - tw - offset;
  if (y + th > window.innerHeight - 8) y = e.clientY - th - offset;
  tooltip.style.left = x + 'px';
  tooltip.style.top  = y + 'px';
}

function hideTooltip() {
  tooltip.style.display = 'none';
}

// ─── Hover: raycasting + Cesium highlight ─────────────────────────────────────

const raycaster = new THREE.Raycaster();
const pointer   = new THREE.Vector2();

/** Mesh currently under the cursor (error tile, or null) */
let hoveredMesh = null;

/** Data of the active tile under the cursor (or null) */
let hoveredActiveTile = null;

const MAT_ERROR_NORMAL = new THREE.MeshBasicMaterial({
  color: 0xff2222, transparent: true, opacity: 0.55, depthWrite: false,
});
const MAT_ERROR_HOVER = new THREE.MeshBasicMaterial({
  color: 0xff8800, transparent: true, opacity: 0.8, depthWrite: false,
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  pointer.x =  ((e.clientX - rect.left)  / rect.width)  * 2 - 1;
  pointer.y = -((e.clientY - rect.top)   / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);

  // Single pass — collect both mesh types
  const errorMeshes  = [];
  const activeMeshes = [];
  tileGroup.traverse((obj) => {
    if (!obj.isMesh) return;
    if (obj.userData.errorTileKey)  errorMeshes.push(obj);
    if (obj.userData.activeTileKey) activeMeshes.push(obj);
  });

  // Error tile hits
  const errorHits  = raycaster.intersectObjects(errorMeshes, false);
  const newErrorHit = errorHits.length > 0 ? errorHits[0].object : null;

  // Active tile hits (only if the toggle is enabled)
  const newActiveData = settings.activeTilesOnScene && activeMeshes.length
    ? activeTileData.get(raycaster.intersectObjects(activeMeshes, false)[0]?.object?.userData?.activeTileKey)
    : null;

  // ── Error tile hover ──────────────────────────────────────────────────────
  if (newErrorHit !== hoveredMesh) {
    if (hoveredMesh) {
      hoveredMesh.material = MAT_ERROR_NORMAL;
      hoveredMesh = null;
      hideTooltip();
    }
    if (newErrorHit) {
      hoveredMesh = newErrorHit;
      newErrorHit.material = MAT_ERROR_HOVER;
      const data = errorTileData.get(newErrorHit.userData.errorTileKey);
      if (data) showTooltip(e, data);
    }
  } else if (hoveredMesh) {
    moveTooltip(e);
  }

  // ── Active tile hover ─────────────────────────────────────────────────────
  if (newActiveData !== hoveredActiveTile) {
    if (hoveredActiveTile) {
      hoveredActiveTile.fillMesh.material.opacity = 0;
    }
    hoveredActiveTile = newActiveData ?? null;
    if (hoveredActiveTile) {
      hoveredActiveTile.fillMesh.material.opacity = 0.15;
    }
  }

  // ── Cesium highlight: error takes priority over active ───────────────────
  if (hoveredMesh) {
    const data = errorTileData.get(hoveredMesh.userData.errorTileKey);
    if (data) {
      hoverEntity.rectangle.coordinates = Rectangle.fromDegrees(data.west, data.south, data.east, data.north);
      hoverEntity.show = true;
    }
  } else if (hoveredActiveTile) {
    hoverEntity.rectangle.coordinates = Rectangle.fromDegrees(
      hoveredActiveTile.west, hoveredActiveTile.south,
      hoveredActiveTile.east, hoveredActiveTile.north,
    );
    hoverEntity.show = true;
  } else {
    hoverEntity.show = false;
  }

  canvas.style.cursor = (hoveredMesh || hoveredActiveTile) ? 'pointer' : '';
});


function flyToTileData(data) {
  const centerLon = (data.west + data.east)  / 2;
  const centerLat = (data.south + data.north) / 2;
  // Keep the current height — don't change zoom so the grid doesn't rebuild
  const currentHeight = cesiumViewer.camera.positionCartographic.height;
  cesiumViewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(centerLon, centerLat, currentHeight),
    duration: 1.5,
  });
}

// Click on a square in the scene — fly-to enabled via the toggle
canvas.addEventListener('click', (e) => {
  if (!settings.flyToTile) return;

  const rect = canvas.getBoundingClientRect();
  const px = new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width)  * 2 - 1,
    -((e.clientY - rect.top)  / rect.height) * 2 + 1,
  );
  raycaster.setFromCamera(px, camera);

  const errorMeshes  = [];
  const activeMeshes = [];
  tileGroup.traverse((obj) => {
    if (!obj.isMesh) return;
    if (obj.userData.errorTileKey)  errorMeshes.push(obj);
    if (obj.userData.activeTileKey) activeMeshes.push(obj);
  });

  // error tiles take priority
  const errorHits = raycaster.intersectObjects(errorMeshes, false);
  if (errorHits.length) {
    const data = errorTileData.get(errorHits[0].object.userData.errorTileKey);
    if (data) { flyToTileData(data); return; }
  }

  // active tiles
  const activeHits = raycaster.intersectObjects(activeMeshes, false);
  if (activeHits.length) {
    const data = activeTileData.get(activeHits[0].object.userData.activeTileKey);
    if (data) flyToTileData(data);
  }
});


canvas.addEventListener('mouseleave', () => {
  if (hoveredMesh) {
    hoveredMesh.material = MAT_ERROR_NORMAL;
    hoveredMesh = null;
  }
  if (hoveredActiveTile) {
    hoveredActiveTile.fillMesh.material.opacity = 0;
    hoveredActiveTile = null;
  }
  hoverEntity.show = false;
  canvas.style.cursor = '';
  hideTooltip();
});

// ─── Tile grid ────────────────────────────────────────────────────────────────

cesiumViewer.scene.globe.tileLoadProgressEvent.addEventListener((queueLength) => {
  if (queueLength === 0) {
    const tiles = cesiumViewer.scene.globe._surface._tilesToRender;
    buildTileGrid(tiles);
    focusCameraOnTiles(tiles);
    if (settings.glbTiles) loadGlbForViewport();
  }
});

/**
 * Converts geographic coordinates (lon/lat) and tile level into a Three.js position.
 *
 * @param {number} lon
 * @param {number} lat
 * @param {number} level
 * @returns {THREE.Vector3}
 */
function geoToScene(lon, lat, level) {
  return new THREE.Vector3(lon, lat, -level * LEVEL_DEPTH);
}

/**
 * Positions the Three.js camera so that all tiles fit in the frame.
 *
 * @param {Array} tiles - Array of QuadtreeTile from Cesium
 */
function focusCameraOnTiles(tiles) {
  if (!tiles.length) return;

  let minLon = Infinity, maxLon = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;
  let minLevel = Infinity;

  tiles.forEach((tile) => {
    const r = tile.rectangle;
    const west  = r.west  * 180 / Math.PI;
    const east  = r.east  * 180 / Math.PI;
    const south = r.south * 180 / Math.PI;
    const north = r.north * 180 / Math.PI;
    if (west  < minLon)        minLon   = west;
    if (east  > maxLon)        maxLon   = east;
    if (south < minLat)        minLat   = south;
    if (north > maxLat)        maxLat   = north;
    if (tile.level < minLevel) minLevel = tile.level;
  });

  const centerLon = (minLon + maxLon) / 2;
  const centerLat = (minLat + maxLat) / 2;
  const span      = Math.max(maxLon - minLon, maxLat - minLat);
  const tileZ     = -minLevel * LEVEL_DEPTH;
  const fovRad    = camera.fov * Math.PI / 180;
  const dist      = (span / 2) / Math.tan(fovRad / 2) * 1.4;

  controls.target.set(centerLon, centerLat, tileZ);
  camera.position.set(centerLon, centerLat, tileZ + dist);
  controls.update();
}

/**
 * Builds Cesium tile outlines in the Three.js scene.
 * Tiles already added are skipped via seenTiles.
 *
 * @param {Array} tiles - Array of QuadtreeTile from Cesium
 */
function buildTileGrid(tiles) {
  tiles.forEach((tile) => {
    const key = `${tile.level}/${tile.x}/${tile.y}`;
    if (seenTiles.has(key)) return;
    seenTiles.add(key);

    const r     = tile.rectangle;
    const west  = r.west  * 180 / Math.PI;
    const east  = r.east  * 180 / Math.PI;
    const south = r.south * 180 / Math.PI;
    const north = r.north * 180 / Math.PI;
    const z     = -tile.level * LEVEL_DEPTH;

    const baseColor = LEVEL_COLORS[tile.level % LEVEL_COLORS.length];

    const pts = [
      geoToScene(west, south, tile.level),
      geoToScene(east, south, tile.level),
      geoToScene(east, north, tile.level),
      geoToScene(west, north, tile.level),
      geoToScene(west, south, tile.level),
    ];
    tileGroup.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: baseColor }),
    ));

    const w = east - west;
    const h = north - south;
    const cx = (west + east) / 2;
    const cy = (south + north) / 2;

    // Semi-transparent fill — shown on hover
    const fillMat = new THREE.MeshBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const fillMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), fillMat);
    fillMesh.position.set(cx, cy, z - 0.01);
    tileGroup.add(fillMesh);

    // Invisible mesh for raycasting
    const hitMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    hitMesh.position.set(cx, cy, z);
    hitMesh.userData.activeTileKey = key;
    tileGroup.add(hitMesh);

    activeTileData.set(key, {
      fillMesh, baseColor,
      west, east, south, north,
      level: tile.level, x: tile.x, y: tile.y,
    });
  });
}

// ─── Render loop ──────────────────────────────────────────────────────────────

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
