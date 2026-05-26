import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Viewer, Ion, Cartesian3, UrlTemplateImageryProvider, ImageryLayer } from 'cesium';

window.CESIUM_BASE_URL = '/cesium';
Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2ZDg4NGM2Yy04ZGI2LTRiMmQtODYzMi0zN2FiNjk2OGZhNTUiLCJpZCI6MjQ3OTkxLCJpYXQiOjE3Mjg4OTk4NDR9.BCXMjcfaozkXi39xo656RKTNAYKHrgw3ARreKCN9i4A';

const AMSTERDAM = { lon: 4.9041, lat: 52.3676 };

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
  destination: Cartesian3.fromDegrees(AMSTERDAM.lon, AMSTERDAM.lat, 5000000),
});

cesiumViewer.scene.globe.tileLoadProgressEvent.addEventListener((queueLength) => {
  if (queueLength === 0) {
    const tiles = cesiumViewer.scene.globe._surface._tilesToRender;
    buildTileGrid(tiles);
    focusCameraOnTiles(tiles);
  }
});

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

const seenTiles = new Set();

/**
 * Преобразует географические координаты (lon/lat) и уровень тайла в позицию Three.js.
 * Долгота и широта используются напрямую как X/Y, а уровень масштабирования
 * отображается на ось Z (глубину), чтобы разные уровни тайлов располагались
 * на отдельных «слоях» сцены.
 *
 * @param {number} lon   - Долгота в градусах
 * @param {number} lat   - Широта в градусах
 * @param {number} level - Уровень масштабирования тайла (zoom level)
 * @returns {THREE.Vector3} Позиция в координатах Three.js-сцены
 */
function geoToScene(lon, lat, level) {
  return new THREE.Vector3(lon, lat, -level * LEVEL_DEPTH);
}

/**
 * Позиционирует камеру Three.js так, чтобы все переданные тайлы Cesium
 * поместились в поле зрения.
 *
 * Алгоритм:
 * 1. Вычисляет ограничивающий прямоугольник (bounding box) по lon/lat для всех тайлов.
 * 2. Определяет глубину Z, соответствующую минимальному уровню тайлов.
 * 3. Отодвигает камеру вдоль оси Z на расстояние, достаточное для охвата
 *    всей сетки с учётом поля зрения (FOV) и коэффициента отступа 1.4.
 *
 * @param {Array} tiles - Массив объектов тайлов Cesium (QuadtreeTile),
 *                        каждый из которых содержит свойства `rectangle` и `level`
 */
function focusCameraOnTiles(tiles) {
  if (!tiles.length) return;

  let minLon = Infinity, maxLon = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;
  let minLevel = Infinity, maxLevel = -Infinity;

  tiles.forEach((tile) => {
    const r = tile.rectangle;
    const west = r.west * 180 / Math.PI;
    const east = r.east * 180 / Math.PI;
    const south = r.south * 180 / Math.PI;
    const north = r.north * 180 / Math.PI;
    if (west < minLon) minLon = west;
    if (east > maxLon) maxLon = east;
    if (south < minLat) minLat = south;
    if (north > maxLat) maxLat = north;
    if (tile.level < minLevel) minLevel = tile.level;
    if (tile.level > maxLevel) maxLevel = tile.level;
  });

  const centerLon = (minLon + maxLon) / 2;
  const centerLat = (minLat + maxLat) / 2;
  const spanLon = maxLon - minLon;
  const spanLat = maxLat - minLat;
  const span = Math.max(spanLon, spanLat);

  const tileZ = -minLevel * LEVEL_DEPTH;
  const fovRad = camera.fov * Math.PI / 180;
  const dist = (span / 2) / Math.tan(fovRad / 2) * 1.4;

  controls.target.set(centerLon, centerLat, tileZ);
  camera.position.set(centerLon, centerLat, tileZ + dist);
  controls.update();
}

/**
 * Строит визуальную сетку тайлов Cesium в Three.js-сцене.
 *
 * Для каждого ещё не отрисованного тайла:
 * - переводит его границы (west/east/south/north) из радиан в градусы;
 * - выбирает цвет контура на основе уровня тайла (из палитры LEVEL_COLORS);
 * - создаёт замкнутый прямоугольный контур (LINE_STRIP) из четырёх угловых точек
 *   и добавляет его в группу `tileGroup`.
 *
 * Уже добавленные тайлы отслеживаются через `seenTiles`, чтобы не дублировать
 * геометрию при повторных вызовах.
 *
 * @param {Array} tiles - Массив объектов тайлов Cesium (QuadtreeTile),
 *                        каждый из которых содержит `rectangle`, `level`, `x`, `y`
 */
function buildTileGrid(tiles) {
  tiles.forEach((tile) => {
    const key = `${tile.level}/${tile.x}/${tile.y}`;
    if (seenTiles.has(key)) return;
    seenTiles.add(key);

    const r = tile.rectangle;
    const west = r.west * 180 / Math.PI;
    const east = r.east * 180 / Math.PI;
    const south = r.south * 180 / Math.PI;
    const north = r.north * 180 / Math.PI;

    const color = LEVEL_COLORS[tile.level % LEVEL_COLORS.length];
    const points = [
      geoToScene(west, south, tile.level),
      geoToScene(east, south, tile.level),
      geoToScene(east, north, tile.level),
      geoToScene(west, north, tile.level),
      geoToScene(west, south, tile.level),
    ];

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    tileGroup.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color })));
  });
}

/**
 * Запускает рендер-цикл Three.js.
 *
 * На каждом кадре:
 * - обновляет OrbitControls (применяет инерцию/damping);
 * - рендерит сцену с текущей камерой.
 *
 * Вызывает сама себя через `requestAnimationFrame`, образуя бесконечный цикл
 * с синхронизацией по частоте обновления дисплея.
 */
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
