import { Cartesian3 } from 'cesium';
import HomeIcon from '../assets/icons/home.svg?react';
import MinusIcon from '../assets/icons/minus.svg?react';
import PlusIcon from '../assets/icons/plus.svg?react';
import { AMSTERDAM, HOME_HEIGHT } from '../cesium/cesiumConfig';
import { useViewer } from '../cesium/viewerStore';

const ZOOM_IN_FACTOR = 0.5;
const ZOOM_OUT_FACTOR = 2;

export function MapControls() {
  const viewer = useViewer();

  const resetView = () => {
    if (!viewer) {
      return;
    }

    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(AMSTERDAM.lon, AMSTERDAM.lat, HOME_HEIGHT),
      duration: 1.2,
    });
  };

  const zoomBy = (factor: number) => {
    if (!viewer) {
      return;
    }

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
        <HomeIcon aria-hidden="true" />
      </button>
      <div id="map-zoom">
        <button className="map-zoom-btn" aria-label="Zoom in" onClick={() => zoomBy(ZOOM_IN_FACTOR)}>
          <PlusIcon aria-hidden="true" />
        </button>
        <div className="map-zoom-divider" />
        <button className="map-zoom-btn" aria-label="Zoom out" onClick={() => zoomBy(ZOOM_OUT_FACTOR)}>
          <MinusIcon aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
