import { Rectangle } from 'cesium';
import { useViewer } from '../cesium/viewerStore';
import { useAppSelector } from '../store/hooks';
import { selectIsPanelOpen } from '../store/uiSlice';
import { selectLevelStats, type LevelStats } from '../store/tilesSlice';
import { ANALYTICS_PANEL } from '../constants';

export function AnalyticsPanel() {
  const analyticsOpen = useAppSelector((s) => selectIsPanelOpen(s, ANALYTICS_PANEL));
  const levelStats = useAppSelector(selectLevelStats);
  const viewer = useViewer();

  const FIT_SHRINK = 0.5;

  const flyToLevel = (stats: LevelStats) => {
    if (!viewer) {
      return;
    }

    const centerLon = (stats.west + stats.east) / 2;
    const centerLat = (stats.south + stats.north) / 2;
    const halfLon = ((stats.east - stats.west) * FIT_SHRINK) / 2;
    const halfLat = ((stats.north - stats.south) * FIT_SHRINK) / 2;

    viewer.camera.flyTo({
      destination: Rectangle.fromDegrees(
        centerLon - halfLon,
        centerLat - halfLat,
        centerLon + halfLon,
        centerLat + halfLat,
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
                <td className="stats-table-empty" colSpan={3}>
                  No tiles loaded yet
                </td>
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
