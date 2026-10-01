import { describe, expect, it } from 'vitest';
import { containsPoint } from './containsPoint';

const bounds = { west: 10, east: 20, south: -5, north: 5 };

describe('containsPoint', () => {
  it('returns true for a point inside the bounds', () => {
    expect(containsPoint(bounds, 15, 0)).toBe(true);
  });

  it('includes the edges', () => {
    expect(containsPoint(bounds, 10, -5)).toBe(true);
    expect(containsPoint(bounds, 20, 5)).toBe(true);
  });

  it('returns false for a point outside the bounds', () => {
    expect(containsPoint(bounds, 9.99, 0)).toBe(false);
    expect(containsPoint(bounds, 20.01, 0)).toBe(false);
    expect(containsPoint(bounds, 15, -5.01)).toBe(false);
    expect(containsPoint(bounds, 15, 5.01)).toBe(false);
  });
});
