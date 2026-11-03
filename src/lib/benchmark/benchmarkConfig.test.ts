import { describe, expect, it } from 'vitest';
import { DEFAULT_FLIGHT_SECONDS, readFlightSeconds } from './benchmarkConfig';

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
