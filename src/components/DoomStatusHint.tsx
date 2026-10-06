import { DOOM_PHASE } from '../constants';
import { doomPhaseLabel } from '../lib/doomPhaseLabel';
import { selectDoomStatus } from '../store/doomSlice';
import { useAppSelector } from '../store/hooks';

export function DoomStatusHint() {
  const { phase, progress } = useAppSelector(selectDoomStatus);
  const label = doomPhaseLabel(phase, progress);

  if (!label) {
    return null;
  }

  return (
    <li
      className={phase === DOOM_PHASE.ERROR ? 'settings-hint settings-hint--error' : 'settings-hint'}
      aria-live="polite"
    >
      {label}
    </li>
  );
}
