export const MENU_PANEL = 'menu';
export const ANALYTICS_PANEL = 'analytics';
export const NETWORK_PANEL = 'network';
export const BENCHMARK_PANEL = 'benchmark';

export const ERROR_TILE = 'error';
export const ACTIVE_TILE = 'active';

export const EMPTY_VALUE = '—';

export const BENCHMARK_STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  DONE: 'done',
  ERROR: 'error',
} as const;

export const DOOM_PHASE = {
  IDLE: 'idle',
  LOADING_EMULATOR: 'loadingEmulator',
  DOWNLOADING: 'downloading',
  STARTING: 'starting',
  RUNNING: 'running',
  ERROR: 'error',
} as const;
