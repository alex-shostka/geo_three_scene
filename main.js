import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Viewer, Ion, Cartesian3 } from 'cesium';

window.CESIUM_BASE_URL = '/cesium';
Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2ZDg4NGM2Yy04ZGI2LTRiMmQtODYzMi0zN2FiNjk2OGZhNTUiLCJpZCI6MjQ3OTkxLCJpYXQiOjE3Mjg4OTk4NDR9.BCXMjcfaozkXi39xo656RKTNAYKHrgw3ARreKCN9i4A';

const AMSTERDAM = { lon: 4.9041, lat: 52.3676 };

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
});

window.geoThreeScene = { cesiumViewer };

cesiumViewer.camera.setView({
  destination: Cartesian3.fromDegrees(AMSTERDAM.lon, AMSTERDAM.lat, 50000),
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

function geoToScene(lon, lat, level) {
  return new THREE.Vector3(lon, lat, -level * LEVEL_DEPTH);
}

function focusCameraOnTiles(tiles) {
  if (!tiles.length) return;
  const avgLevel = tiles.reduce((s, t) => s + t.level, 0) / tiles.length;
  const tileZ = -avgLevel * LEVEL_DEPTH;
  camera.position.set(AMSTERDAM.lon, AMSTERDAM.lat, tileZ + 3);
  controls.target.set(AMSTERDAM.lon, AMSTERDAM.lat, tileZ);
  controls.update();
}

function buildTileGrid(tiles) {
  tiles.forEach((tile) => {
    const key = `${tile.level}/${tile.x}/${tile.y}`;
    if (seenTiles.has(key)) return;
    seenTiles.add(key);

    const r = tile.rectangle;
    const west  = r.west  * 180 / Math.PI;
    const east  = r.east  * 180 / Math.PI;
    const south = r.south * 180 / Math.PI;
    const north = r.north * 180 / Math.PI;

    const color = LEVEL_COLORS[tile.level % LEVEL_COLORS.length];
    const points = [
      geoToScene(west,  south, tile.level),
      geoToScene(east,  south, tile.level),
      geoToScene(east,  north, tile.level),
      geoToScene(west,  north, tile.level),
      geoToScene(west,  south, tile.level),
    ];

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    tileGroup.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color })));
  });
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
