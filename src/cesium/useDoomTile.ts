import { useEffect } from 'react';
import { Cartesian2, Cartographic, ImageMaterialProperty, Rectangle, type Entity, type Viewer } from 'cesium';
import { loadEmulators, type CommandInterface } from '../lib/loadEmulators';
import { DOM_KEY_TO_DOS_KEY } from '../lib/domKeyToDosKey';
import type { TileBounds } from '../types';

const DOOM_BUNDLE_URL = 'https://v8.js-dos.com/bundles/doom.jsdos';

// DOS switches video modes during boot (text mode, then VGA graphics), so DOOM's
// reported frame size isn't stable from the first frame. Cesium locks its GPU
// texture to the <video>'s size the first time it sees a frame and never resizes
// it afterward, so if the source canvas later shrank, the leftover texture area
// stayed permanently black. Frames are scaled into this fixed-size output canvas
// instead, so the captured stream's resolution — and Cesium's texture — never drifts.
const OUTPUT_WIDTH = 320;
const OUTPUT_HEIGHT = 200;

/**
 * Proof-of-concept: drapes a live DOOM feed (via js-dos's `emulators` package) onto
 * one tile's rectangle on the Cesium globe, in place of its imagery.
 *
 * Cesium's material system only re-uploads a texture every frame for
 * HTMLVideoElement sources — a canvas source gets uploaded once and then ignored —
 * so the DOS screen is drawn into an offscreen canvas and piped into a hidden
 * <video> via canvas.captureStream(), and that video is what Cesium is given.
 *
 * Keyboard input is forwarded to DOOM only while the cursor is hovering this
 * tile's rectangle on the globe, so it doesn't steal keystrokes from the rest
 * of the page.
 */
export function useDoomTile(viewer: Viewer | null, bounds: TileBounds | null) {
  useEffect(() => {
    if (!viewer || !bounds) return;
    let cancelled = false;
    let entity: Entity | null = null;
    let stream: MediaStream | null = null;
    let ci: CommandInterface | null = null;

    const source = document.createElement('canvas');
    source.width = OUTPUT_WIDTH;
    source.height = OUTPUT_HEIGHT;
    const sourceCtx = source.getContext('2d');

    const output = document.createElement('canvas');
    output.width = OUTPUT_WIDTH;
    output.height = OUTPUT_HEIGHT;
    const outputCtx = output.getContext('2d');

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;

    let rgba = new Uint8ClampedArray(source.width * source.height * 4);

    loadEmulators()
      .then(() => fetch(DOOM_BUNDLE_URL))
      .then((res) => res.arrayBuffer())
      .then(async (buf) => {
        if (cancelled) return;
        ci = await window.emulators!.dosboxWorker(new Uint8Array(buf));
        if (cancelled) { ci.exit(); return; }

        ci.events().onFrameSize((width, height) => {
          source.width = width;
          source.height = height;
          rgba = new Uint8ClampedArray(width * height * 4);
        });
        ci.events().onFrame((rgb) => {
          if (!rgb || !sourceCtx || !outputCtx) return;
          const pixels = source.width * source.height;
          for (let i = 0; i < pixels; i++) {
            rgba[i * 4] = rgb[i * 3];
            rgba[i * 4 + 1] = rgb[i * 3 + 1];
            rgba[i * 4 + 2] = rgb[i * 3 + 2];
            rgba[i * 4 + 3] = 255;
          }
          sourceCtx.putImageData(new ImageData(rgba, source.width, source.height), 0, 0);
          outputCtx.drawImage(source, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
        });

        stream = output.captureStream(30);
        video.srcObject = stream;
        await video.play();
        if (cancelled) return;

        entity = viewer.entities.add({
          rectangle: {
            coordinates: Rectangle.fromDegrees(bounds.west, bounds.south, bounds.east, bounds.north),
            material: new ImageMaterialProperty({ image: video }),
            height: 0,
          },
        });
      })
      .catch((err) => console.error('DOOM tile failed to start', err));

    // ── keyboard input, forwarded only while the cursor is over this tile ────
    let isHovering = false;
    const heldKeys = new Set<number>();

    const handleMouseMove = (e: MouseEvent) => {
      const carto = viewer.camera.pickEllipsoid(
        new Cartesian2(e.offsetX, e.offsetY),
        viewer.scene.globe.ellipsoid,
      );
      if (!carto) { isHovering = false; return; }
      const { longitude, latitude } = Cartographic.fromCartesian(carto);
      const lon = (longitude * 180) / Math.PI;
      const lat = (latitude * 180) / Math.PI;
      isHovering = lon >= bounds.west && lon <= bounds.east && lat >= bounds.south && lat <= bounds.north;
    };
    const handleMouseLeave = () => { isHovering = false; };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isHovering || !ci) return;
      const dosKey = DOM_KEY_TO_DOS_KEY[e.code];
      if (dosKey === undefined) return;
      e.preventDefault();
      ci.sendKeyEvent(dosKey, true);
      heldKeys.add(dosKey);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const dosKey = DOM_KEY_TO_DOS_KEY[e.code];
      if (dosKey === undefined || !heldKeys.has(dosKey)) return;
      e.preventDefault();
      ci?.sendKeyEvent(dosKey, false);
      heldKeys.delete(dosKey);
    };

    viewer.canvas.addEventListener('mousemove', handleMouseMove);
    viewer.canvas.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      cancelled = true;
      viewer.canvas.removeEventListener('mousemove', handleMouseMove);
      viewer.canvas.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      heldKeys.forEach((key) => ci?.sendKeyEvent(key, false));
      if (entity) viewer.entities.remove(entity);
      stream?.getTracks().forEach((t) => t.stop());
      ci?.exit();
    };
  }, [viewer, bounds]);
}
