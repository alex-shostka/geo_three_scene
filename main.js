import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  Viewer, Ion, Cartesian3,
  UrlTemplateImageryProvider, ImageryLayer,
  Rectangle, Color,
} from 'cesium';

window.CESIUM_BASE_URL = '/cesium';
Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2ZDg4NGM2Yy04ZGI2LTRiMmQtODYzMi0zN2FiNjk2OGZhNTUiLCJpZCI6MjQ3OTkxLCJpYXQiOjE3Mjg4OTk4NDR9.BCXMjcfaozkXi39xo656RKTNAYKHrgw3ARreKCN9i4A';

const AMSTERDAM = { lon: 4.9041, lat: 52.3676 };

// ─── Hamburger menu ──────────────────────────────────────────────────────────

const menuBtn   = document.getElementById('menu-btn');
const sidePanel = document.getElementById('side-panel');

menuBtn.addEventListener('click', () => {
  const isOpen = sidePanel.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', isOpen);
});

// ─── Settings ────────────────────────────────────────────────────────────────

export const settings = {
  activeTilesOnScene: false,
};

document.getElementById('toggle-active-tiles').addEventListener('change', (e) => {
  settings.activeTilesOnScene = e.target.checked;
  if (!e.target.checked && hoveredActiveTile) {
    hoveredActiveTile.fillMesh.material.opacity = 0;
    hoveredActiveTile = null;
  }
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

/** Ключи уже добавленных в сцену тайлов — предотвращает дублирование */
const seenTiles = new Set();

/**
 * Хранит данные об ошибочных тайлах для hover-логики.
 * key = `err:level/x/y`, value = { mesh, west, east, south, north } (в градусах)
 */
const errorTileData = new Map();

/**
 * Хранит данные об активных тайлах сцены для hover-логики.
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

// ─── Cesium hover entity ──────────────────────────────────────────────────────

/**
 * Одна переиспользуемая entity для подсветки тайла на глобусе.
 * Меняем только её `rectangle.coordinates` при каждом hover.
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

// ─── Обработка ошибок тайлов ─────────────────────────────────────────────────

/**
 * Когда Cesium не может загрузить тайл (404 и т.д.) — рисуем красный квадрат
 * в Three.js-сцене и сохраняем его данные для hover.
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

  // Заполненный красный квадрат (только Mesh участвует в raycasting)
  const mat = new THREE.MeshBasicMaterial({
    color: 0xff2222,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(east - west, north - south), mat);
  mesh.position.set((west + east) / 2, (south + north) / 2, z);
  mesh.userData.errorTileKey = key;   // маркер для raycaster
  tileGroup.add(mesh);

  // Красный контур поверх
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

  // Сохраняем данные для hover
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

/** Mesh который сейчас под курсором (error tile, или null) */
let hoveredMesh = null;

/** Данные активного тайла под курсором (или null) */
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

  // Один проход — собираем оба типа meshes
  const errorMeshes  = [];
  const activeMeshes = [];
  tileGroup.traverse((obj) => {
    if (!obj.isMesh) return;
    if (obj.userData.errorTileKey)  errorMeshes.push(obj);
    if (obj.userData.activeTileKey) activeMeshes.push(obj);
  });

  // Хиты error-тайлов
  const errorHits  = raycaster.intersectObjects(errorMeshes, false);
  const newErrorHit = errorHits.length > 0 ? errorHits[0].object : null;

  // Хиты активных тайлов (только если тоггл включён)
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

  // ── Cesium highlight: error имеет приоритет над активным ─────────────────
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


// Клик по красному квадрату — подлетаем к тайлу на Cesium
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const px = new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width)  * 2 - 1,
    -((e.clientY - rect.top)  / rect.height) * 2 + 1,
  );

  raycaster.setFromCamera(px, camera);

  const meshes = [];
  tileGroup.traverse((obj) => {
    if (obj.isMesh && obj.userData.errorTileKey) meshes.push(obj);
  });
  const hits = raycaster.intersectObjects(meshes, false);
  if (!hits.length) return;

  const data = errorTileData.get(hits[0].object.userData.errorTileKey);
  if (!data) return;

  const centerLon = (data.west  + data.east)  / 2;
  const centerLat = (data.south + data.north) / 2;
  const spanDeg   = Math.max(data.east - data.west, data.north - data.south);
  // высота ~= размер тайла в метрах * коэффициент (1° ≈ 111 км)
  const height    = spanDeg * 111_000 * 1.7;

  cesiumViewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(centerLon, centerLat, height),
    duration: 1.5,
  });
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
  }
});

/**
 * Преобразует географические координаты (lon/lat) и уровень тайла в позицию Three.js.
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
 * Позиционирует камеру Three.js так, чтобы все тайлы поместились в кадр.
 *
 * @param {Array} tiles - Массив QuadtreeTile от Cesium
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
 * Строит контуры тайлов Cesium в Three.js-сцене.
 * Уже добавленные тайлы пропускаются через seenTiles.
 *
 * @param {Array} tiles - Массив QuadtreeTile от Cesium
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

    // Полупрозрачная заливка — показывается при ховере
    const fillMat = new THREE.MeshBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const fillMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), fillMat);
    fillMesh.position.set(cx, cy, z - 0.01);
    tileGroup.add(fillMesh);

    // Невидимый mesh для raycasting
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
