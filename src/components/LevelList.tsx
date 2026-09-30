import { type CSSProperties } from 'react';
import { useAppDispatch, useAppSelector, useAppStore } from '../store/hooks';
import { selectAllTiles, selectLevelCounts, setFocusBounds } from '../store/tilesSlice';
import { levelColor, computeLevelFocusBounds } from '../lib/tileGeometry';

function toCssColor(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

/** Floating legend over the Three.js scene: one entry per rendered zoom level, click to fly there. */
export function LevelList() {
  const levels = useAppSelector(selectLevelCounts);
  const store = useAppStore();
  const dispatch = useAppDispatch();

  if (!levels.length) {
    return null;
  }

  const handleJump = (level: number) => {
    // Tiles are read only at click time, so the list doesn't re-render on every tile load.
    const bounds = computeLevelFocusBounds(selectAllTiles(store.getState()), level);

    if (bounds) {
      dispatch(setFocusBounds(bounds));
    }
  };

  return (
    <ul className="level-list" aria-label="Rendered zoom levels">
      {levels.map(({ level, count }) => (
        <li key={level}>
          <button
            type="button"
            className="level-list-item"
            style={{ '--lvl-color': toCssColor(levelColor(level)) } as CSSProperties}
            onClick={() => handleJump(level)}
          >
            <span className="level-list-swatch" />
            <span className="level-list-label">L{level}</span>
            <span className="level-list-count">{count}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
