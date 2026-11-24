import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FLIGHT_SECONDS,
  DEFAULT_MAXIMUM_SCREEN_SPACE_ERROR,
  readFlightSeconds,
  readMaximumScreenSpaceError,
} from './benchmarkConfig';

describe('readFlightSeconds', () => {
  it.each([
    ['?bench', DEFAULT_FLIGHT_SECONDS],
    ['?bench&flight=0.5', 0.5],
    ['?bench&flight=0', DEFAULT_FLIGHT_SECONDS],
    ['?bench&flight=fast', DEFAULT_FLIGHT_SECONDS],
  ])('reads %s as %d s', (search, seconds) => {
    expect(readFlightSeconds(search)).toBe(seconds);
  });
});

describe('readMaximumScreenSpaceError', () => {
  it.each([
    ['?bench', DEFAULT_MAXIMUM_SCREEN_SPACE_ERROR],
    ['?bench&msse=8', 8],
    ['?bench&msse=0', DEFAULT_MAXIMUM_SCREEN_SPACE_ERROR],
    ['?bench&msse=sharp', DEFAULT_MAXIMUM_SCREEN_SPACE_ERROR],
  ])('reads %s as %d', (search, value) => {
    expect(readMaximumScreenSpaceError(search)).toBe(value);
  });
});
