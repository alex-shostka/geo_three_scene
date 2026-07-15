import { useMemo } from 'react';
import { useTiles } from '../state/TilesContext';

export function TileHud() {
  const { tiles } = useTiles();

  const errorCount = useMemo(() => {
    let count = 0;
    tiles.forEach((tile) => { if (tile.type === 'error') count++; });
    return count;
  }, [tiles]);

  return (
    <div id="tile-hud" className={errorCount > 0 ? 'has-errors' : ''}>
      <span id="hud-icon">⚠</span>
      <span id="hud-count">{errorCount}</span>
      <span id="hud-label">error tiles</span>
    </div>
  );
}
