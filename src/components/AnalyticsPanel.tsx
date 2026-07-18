import { useMemo } from 'react';
import { Rectangle } from 'cesium';
import { useUi } from '../state/UiContext';
import { useTiles } from '../state/TilesContext';
import { useCesium } from '../state/CesiumContext';

interface LevelStats {
  level: number;
  loaded: number;
  errors: number;
  west: number;
  east: number;
  south: number;
  north: number;
}

export function AnalyticsPanel() {
  const { analyticsOpen } = useUi();
  const { tiles } = useTiles();
  const { viewer } = useCesium();

  const levelStats = useMemo(() => {
    const stats = new Map<number, Omit<LevelStats, 'level'>>();
    tiles.forEach((tile) => {
      const entry = stats.get(tile.level) ?? {
        loaded: 0, errors: 0,
        west: Infinity, east: -Infinity, south: Infinity, north: -Infinity,
      };
      if (tile.type === 'active') entry.loaded += 1;
      else entry.errors += 1;
      entry.west = Math.min(entry.west, tile.west);
      entry.east = Math.max(entry.east, tile.east);
      entry.south = Math.min(entry.south, tile.south);
      entry.north = Math.max(entry.north, tile.north);
      stats.set(tile.level, entry);
    });
    return Array.from(stats.entries())
      .sort(([a], [b]) => a - b)
      .map(([level, entry]) => ({ level, ...entry }));
  }, [tiles]);

  // Fitting the camera exactly to the tiles' bounding box puts it right at the
  // boundary distance where Cesium's screen-space-error check backs off to the
  // next coarser level. Flying to a tighter rectangle around the same center
  // keeps the camera close enough that the intended level actually renders.
  const FIT_SHRINK = 0.5;

  const flyToLevel = (stats: LevelStats) => {
    if (!viewer) return;
    const centerLon = (stats.west + stats.east) / 2;
    const centerLat = (stats.south + stats.north) / 2;
    const halfLon = ((stats.east - stats.west) * FIT_SHRINK) / 2;
    const halfLat = ((stats.north - stats.south) * FIT_SHRINK) / 2;
    viewer.camera.flyTo({
      destination: Rectangle.fromDegrees(
        centerLon - halfLon, centerLat - halfLat,
        centerLon + halfLon, centerLat + halfLat,
      ),
      duration: 1.2,
    });
  };

  return (
    <aside id="analytics-panel" className={analyticsOpen ? 'open' : ''}>
      <div id="analytics-panel-header">
        <span id="analytics-panel-title">Analytics</span>
      </div>
      <div id="analytics-panel-content">
        <table className="stats-table">
          <thead>
            <tr>
              <th>Level</th>
              <th>Tiles loaded</th>
              <th>Errors</th>
            </tr>
          </thead>
          <tbody>
            {levelStats.length === 0 ? (
              <tr>
                <td className="stats-table-empty" colSpan={3}>No tiles loaded yet</td>
              </tr>
            ) : (
              levelStats.map((stats) => (
                <tr key={stats.level} className="stats-table-row" onClick={() => flyToLevel(stats)}>
                  <td>{stats.level}</td>
                  <td>{stats.loaded}</td>
                  <td className={stats.errors > 0 ? 'stats-table-error' : ''}>{stats.errors}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </aside>
  );
}
