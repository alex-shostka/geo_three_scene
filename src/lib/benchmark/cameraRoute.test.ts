import { describe, expect, it } from 'vitest';
import { buildCameraRoute, formatHeight } from './cameraRoute';

const TARGET = { lon: 4.9, lat: 52.4 };

describe('buildCameraRoute', () => {
  const route = buildCameraRoute({
    target: TARGET,
    startHeight: 50_000,
    minHeight: 500,
    heightRatio: 2 / 3,
    pitchDeg: -45,
  });

  it('goes down by a third at every step and stops above the minimum height', () => {
    expect(route.map((point) => point.height)).toEqual([
      50_000, 33_333, 22_222, 14_815, 9877, 6584, 4390, 2926, 1951, 1301, 867, 578,
    ]);
  });

  it('places the camera south of the target so a 45° view looks at it', () => {
    const [first] = route;

    expect(first.lon).toBe(TARGET.lon);
    expect((TARGET.lat - first.lat) * 111_320).toBeCloseTo(50_000);
  });

  it('keeps the same heading and pitch on every step', () => {
    expect(new Set(route.map((point) => `${point.headingDeg}/${point.pitchDeg}`))).toEqual(new Set(['0/-45']));
  });
});

describe('formatHeight', () => {
  it.each([
    [50_000, '50 km'],
    [33_333, '33.3 km'],
    [1951, '2 km'],
    [867, '867 m'],
  ])('formats %d as %s', (height, label) => {
    expect(formatHeight(height)).toBe(label);
  });
});
