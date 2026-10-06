import { DOOM_PHASE } from '../constants';
import type { DoomPhase } from '../types';

export function doomPhaseLabel(phase: DoomPhase, progress: number | null): string | null {
  switch (phase) {
    case DOOM_PHASE.LOADING_EMULATOR:
      return 'Loading emulator…';
    case DOOM_PHASE.DOWNLOADING:
      return progress === null ? 'Downloading DOOM…' : `Downloading DOOM… ${progress}%`;
    case DOOM_PHASE.STARTING:
      return 'Starting…';
    case DOOM_PHASE.ERROR:
      return 'Failed to load';
    case DOOM_PHASE.IDLE:
    case DOOM_PHASE.RUNNING:
      return null;
  }
}
