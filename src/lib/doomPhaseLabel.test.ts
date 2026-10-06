import { describe, expect, it } from 'vitest';
import { DOOM_PHASE } from '../constants';
import { doomPhaseLabel } from './doomPhaseLabel';

describe('doomPhaseLabel', () => {
  it('shows the download percent when it is known', () => {
    expect(doomPhaseLabel(DOOM_PHASE.DOWNLOADING, 42)).toBe('Downloading DOOM… 42%');
  });

  it('omits the percent when it is unknown', () => {
    expect(doomPhaseLabel(DOOM_PHASE.DOWNLOADING, null)).toBe('Downloading DOOM…');
  });

  it('returns null when there is nothing to show', () => {
    expect(doomPhaseLabel(DOOM_PHASE.IDLE, null)).toBeNull();
    expect(doomPhaseLabel(DOOM_PHASE.RUNNING, null)).toBeNull();
  });
});
