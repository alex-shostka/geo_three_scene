import { useMemo, type CSSProperties } from 'react';
import { useTiles } from '../state/TilesContext';
import { levelColor, computeLevelFocusBounds } from '../lib/tileGeometry';

function toCssColor(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

/** Floating legend over the Three.js scene: one entry per rendered zoom level, click to fly there. */
export function LevelList() {
  const { tiles, setFocusBounds } = useTiles();

  const levels = useMemo(() => {
    const counts = new Map<number, number>();
    tiles.forEach((tile) => counts.set(tile.level, (counts.get(tile.level) ?? 0) + 1));
    return Array.from(counts.entries())
      .sort(([a], [b]) => a - b)
      .map(([level, count]) => ({ level, count }));
  }, [tiles]);

  if (!levels.length) return null;

  const handleJump = (level: number) => {
    const bounds = computeLevelFocusBounds(tiles.values(), level);
    if (bounds) setFocusBounds(bounds);
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
