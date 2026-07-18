import { useEffect, useMemo, useState } from 'react';
import { useCesium } from '../state/CesiumContext';
import { useTiles } from '../state/TilesContext';
import { LEVEL_DEPTH } from '../lib/tileGeometry';
import { CameraPoseGauges, type CameraPose } from './CameraPoseGauges';
import { InfoTip } from './InfoTip';

const HEIGHT_TIP = 'Camera altitude above the ground.';
const LOD_TIP = 'Tile detail level — higher means more zoomed in.';

export function Footer() {
  const [open, setOpen] = useState(false);
  const { viewer } = useCesium();
  const { tiles, focusBounds } = useTiles();
  const [pose, setPose] = useState<CameraPose | null>(null);

  const errorCount = useMemo(() => {
    let count = 0;
    tiles.forEach((tile) => { if (tile.type === 'error') count++; });
    return count;
  }, [tiles]);

  useEffect(() => {
    if (!viewer) return;

    let lastUpdate = 0;
    const update = () => {
      const now = performance.now();
      if (now - lastUpdate < 100) return;
      lastUpdate = now;

      const carto = viewer.camera.positionCartographic;
      let rollDeg = (viewer.camera.roll * 180) / Math.PI;
      if (rollDeg > 180) rollDeg -= 360;

      setPose({
        height: carto.height,
        lon: (carto.longitude * 180) / Math.PI,
        lat: (carto.latitude * 180) / Math.PI,
        heading: (viewer.camera.heading * 180) / Math.PI,
        pitch: (viewer.camera.pitch * 180) / Math.PI,
        roll: rollDeg,
      });
    };

    update();
    viewer.scene.postRender.addEventListener(update);
    return () => { viewer.scene.postRender.removeEventListener(update); };
  }, [viewer]);

  const lod = focusBounds ? Math.round(-focusBounds.tileZ / LEVEL_DEPTH) : null;

  return (
    <footer id="app-footer" className={open ? 'open' : ''}>
      <div id="footer-bar">
        <div id="camera-info">
          <div className="footer-stat">
            <span className="label-row">
              <InfoTip text={HEIGHT_TIP} />
              <span className="fs-label">Height</span>
            </span>
            <span className="fs-value">{pose ? `${Math.round(pose.height).toLocaleString()} m` : '—'}</span>
          </div>
          <div className="footer-stat">
            <span className="label-row">
              <InfoTip text={LOD_TIP} />
              <span className="fs-label">LOD</span>
            </span>
            <span className="fs-value">{lod ?? '—'}</span>
          </div>
        </div>
        <div id="tile-hud" className={errorCount > 0 ? 'has-errors' : ''}>
          <span className="fs-icon">⚠</span>
          <span className="fs-value">{errorCount}</span>
          <span className="fs-label">error tiles</span>
        </div>
        <button
          id="footer-toggle"
          aria-expanded={open}
          aria-label={open ? 'Collapse footer' : 'Expand footer'}
          onClick={() => setOpen((v) => !v)}
        >
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
            <path
              d="M2 10 L8 4 L14 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <div id="footer-content">
        <CameraPoseGauges pose={pose} />
      </div>
    </footer>
  );
}
