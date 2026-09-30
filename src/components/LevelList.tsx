import { type CSSProperties } from 'react';
import { computeLevelFocusBounds, levelColor } from '../lib/tileGeometry';
import { useAppDispatch, useAppSelector, useAppStore } from '../store/hooks';
import { selectAllTiles, selectLevelCounts, setFocusBounds } from '../store/tilesSlice';

function toCssColor(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

export function LevelList() {
  const levels = useAppSelector(selectLevelCounts);
  const store = useAppStore();
  const dispatch = useAppDispatch();

  if (!levels.length) {
    return null;
  }

  const handleJump = (level: number) => {
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
            style={{ '--lvl-color': toCssColor(levelColor(level)) }}
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
