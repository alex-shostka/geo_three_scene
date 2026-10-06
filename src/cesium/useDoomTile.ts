import { Cartesian2, Cartographic, Math as CesiumMath, ImageMaterialProperty, Rectangle, type Entity } from 'cesium';
import { useEffect } from 'react';
import { DOOM_PHASE } from '../constants';
import { containsPoint } from '../lib/containsPoint';
import { DOM_KEY_TO_DOS_KEY } from '../lib/domKeyToDosKey';
import { doomPhaseLabel } from '../lib/doomPhaseLabel';
import { drawDoomScreen } from '../lib/drawDoomScreen';
import { fetchWithProgress } from '../lib/fetchWithProgress';
import { loadEmulators, type CommandInterface } from '../lib/loadEmulators';
import { setDoomStatus } from '../store/doomSlice';
import { useAppDispatch } from '../store/hooks';
import type { DoomPhase } from '../types';
import { useDoomTarget } from './useDoomTarget';
import { useViewer } from './viewerStore';

const DOOM_BUNDLE_URL = '/doom/doom.jsdos';

const OUTPUT_WIDTH = 320;
const OUTPUT_HEIGHT = 200;

export function useDoomTile() {
  const viewer = useViewer();
  const bounds = useDoomTarget(viewer);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!viewer || !bounds) {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    let entity: Entity | null = null;
    let stream: MediaStream | null = null;
    let ci: CommandInterface | null = null;
    let rgba = new Uint8ClampedArray(OUTPUT_WIDTH * OUTPUT_HEIGHT * 4);
    const source = document.createElement('canvas');
    const sourceCtx = source.getContext('2d');
    const output = document.createElement('canvas');
    const outputCtx = output.getContext('2d');
    const video = document.createElement('video');
    let isHovering = false;
    const heldKeys = new Set<number>();

    const showStatus = (phase: DoomPhase, progress: number | null = null) => {
      if (cancelled) {
        return;
      }

      dispatch(setDoomStatus({ phase, progress }));

      const label = doomPhaseLabel(phase, progress);

      if (label && outputCtx) {
        drawDoomScreen(outputCtx, label.toUpperCase(), progress);
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      const carto = viewer.camera.pickEllipsoid(
        new Cartesian2(event.offsetX, event.offsetY),
        viewer.scene.globe.ellipsoid,
      );

      if (!carto) {
        isHovering = false;

        return;
      }

      const { longitude, latitude } = Cartographic.fromCartesian(carto);

      isHovering = containsPoint(bounds, CesiumMath.toDegrees(longitude), CesiumMath.toDegrees(latitude));
    };
    const handleMouseLeave = () => {
      isHovering = false;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isHovering || !ci) {
        return;
      }

      const dosKey = DOM_KEY_TO_DOS_KEY[event.code];

      if (dosKey === undefined) {
        return;
      }

      event.preventDefault();
      ci.sendKeyEvent(dosKey, true);
      heldKeys.add(dosKey);
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      const dosKey = DOM_KEY_TO_DOS_KEY[event.code];

      if (dosKey === undefined || !heldKeys.has(dosKey)) {
        return;
      }

      event.preventDefault();
      ci?.sendKeyEvent(dosKey, false);
      heldKeys.delete(dosKey);
    };

    const start = async () => {
      stream = output.captureStream(30);
      video.srcObject = stream;
      showStatus(DOOM_PHASE.LOADING_EMULATOR);
      await video.play();

      if (cancelled) {
        return;
      }

      entity = viewer.entities.add({
        rectangle: {
          coordinates: Rectangle.fromDegrees(bounds.west, bounds.south, bounds.east, bounds.north),
          material: new ImageMaterialProperty({ image: video }),
          height: 0,
        },
      });

      const emulators = await loadEmulators();

      if (cancelled) {
        return;
      }

      let lastPercent = 0;

      showStatus(DOOM_PHASE.DOWNLOADING, lastPercent);

      const bundle = await fetchWithProgress(DOOM_BUNDLE_URL, {
        signal: controller.signal,
        onProgress: (loaded, total) => {
          if (!total) {
            return;
          }

          const percent = Math.min(100, Math.floor((loaded / total) * 100));

          if (percent === lastPercent) {
            return;
          }

          lastPercent = percent;
          showStatus(DOOM_PHASE.DOWNLOADING, percent);
        },
      });

      if (cancelled) {
        return;
      }

      showStatus(DOOM_PHASE.STARTING);
      ci = await emulators.dosboxWorker(bundle);

      if (cancelled) {
        ci.exit();

        return;
      }

      ci.events().onFrameSize((width, height) => {
        source.width = width;
        source.height = height;
        rgba = new Uint8ClampedArray(width * height * 4);
      });
      ci.events().onFrame((rgb) => {
        if (!rgb || !sourceCtx || !outputCtx) {
          return;
        }

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
      showStatus(DOOM_PHASE.RUNNING);
    };

    source.width = OUTPUT_WIDTH;
    source.height = OUTPUT_HEIGHT;
    output.width = OUTPUT_WIDTH;
    output.height = OUTPUT_HEIGHT;
    video.muted = true;
    video.playsInline = true;

    start().catch((error: unknown) => {
      if (cancelled) {
        return;
      }

      console.error('DOOM tile failed to start', error);
      showStatus(DOOM_PHASE.ERROR);
    });

    viewer.canvas.addEventListener('mousemove', handleMouseMove);
    viewer.canvas.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      cancelled = true;
      controller.abort();
      viewer.canvas.removeEventListener('mousemove', handleMouseMove);
      viewer.canvas.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      heldKeys.forEach((key) => ci?.sendKeyEvent(key, false));

      if (entity) {
        viewer.entities.remove(entity);
      }

      stream?.getTracks().forEach((t) => t.stop());
      ci?.exit();
    };
  }, [viewer, bounds, dispatch]);
}
