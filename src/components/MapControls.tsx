import { Cartesian3 } from 'cesium';
import { useCesium } from '../state/CesiumContext';
import { AMSTERDAM, HOME_HEIGHT } from '../cesium/cesiumConfig';

const ZOOM_IN_FACTOR = 0.5;
const ZOOM_OUT_FACTOR = 2;

export function MapControls() {
  const { viewer } = useCesium();

  const resetView = () => {
    if (!viewer) return;
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(AMSTERDAM.lon, AMSTERDAM.lat, HOME_HEIGHT),
      duration: 1.2,
    });
  };

  const zoomBy = (factor: number) => {
    if (!viewer) return;
    const { camera } = viewer;
    const carto = camera.positionCartographic;
    camera.flyTo({
      destination: Cartesian3.fromRadians(carto.longitude, carto.latitude, carto.height * factor),
      orientation: { heading: camera.heading, pitch: camera.pitch, roll: camera.roll },
      duration: 0.4,
    });
  };

  return (
    <div id="map-controls">
      <button id="map-reset" aria-label="Reset view" onClick={resetView}>
        <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
          <path
            d="M10 3 L17 9 V17 H12 V12 H8 V17 H3 V9 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <div id="map-zoom">
        <button className="map-zoom-btn" aria-label="Zoom in" onClick={() => zoomBy(ZOOM_IN_FACTOR)}>
          <svg viewBox="0 0 20 20" width="13" height="13" aria-hidden="true">
            <path d="M10 4 V16 M4 10 H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <div className="map-zoom-divider" />
        <button className="map-zoom-btn" aria-label="Zoom out" onClick={() => zoomBy(ZOOM_OUT_FACTOR)}>
          <svg viewBox="0 0 20 20" width="13" height="13" aria-hidden="true">
            <path d="M4 10 H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
