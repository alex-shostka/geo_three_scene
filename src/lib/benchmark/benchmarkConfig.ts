export const MAP_LOADED_QUIET_MS = 500;
export const MAP_LOADED_TIMEOUT_MS = 60_000;

export const BENCHMARK_DEVTOOLS_TRACK = 'Benchmark';

export const ROUTE_START_HEIGHT = 50_000;
export const ROUTE_MIN_HEIGHT = 500;
export const ROUTE_HEIGHT_RATIO = 2 / 3;
export const ROUTE_PITCH_DEG = -45;

export const DEFAULT_FLIGHT_SECONDS = 3;

export const BENCHMARK_RUN_OPTIONS = [1, 5, 10, 20] as const;

export function readFlightSeconds(search: string): number {
  const value = Number(new URLSearchParams(search).get('flight'));

  return value > 0 ? value : DEFAULT_FLIGHT_SECONDS;
}
