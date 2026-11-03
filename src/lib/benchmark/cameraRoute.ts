export interface CameraRoutePoint {
  lon: number;
  lat: number;
  height: number;
  headingDeg: number;
  pitchDeg: number;
}

export interface CameraRouteOptions {
  target: { lon: number; lat: number };
  startHeight: number;
  minHeight: number;
  heightRatio: number;
  pitchDeg: number;
}

const METERS_PER_DEGREE_LAT = 111_320;

export function buildCameraRoute({
  target,
  startHeight,
  minHeight,
  heightRatio,
  pitchDeg,
}: CameraRouteOptions): CameraRoutePoint[] {
  const groundDistancePerMeter = 1 / Math.tan((-pitchDeg * Math.PI) / 180);
  const route: CameraRoutePoint[] = [];

  for (let height = startHeight; height >= minHeight; height *= heightRatio) {
    const roundedHeight = Math.round(height);

    route.push({
      lon: target.lon,
      lat: target.lat - (roundedHeight * groundDistancePerMeter) / METERS_PER_DEGREE_LAT,
      height: roundedHeight,
      headingDeg: 0,
      pitchDeg,
    });
  }

  return route;
}

export function formatHeight(height: number): string {
  if (height >= 1000) {
    return `${Number((height / 1000).toFixed(1))} km`;
  }

  return `${height} m`;
}
