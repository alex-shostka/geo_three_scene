import { Rectangle } from 'cesium';
import { useViewer } from '../cesium/viewerStore';
import { ANALYTICS_PANEL } from '../constants';
import { panelElementId } from '../lib/panelElementId';
import { useAppSelector } from '../store/hooks';
import { selectLevelStats, type LevelStats } from '../store/tilesSlice';
import { selectIsPanelOpen } from '../store/uiSlice';
import { Panel } from './ui/Panel';
import { StatsTable } from './ui/StatsTable';

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
    <Panel id={panelElementId(ANALYTICS_PANEL)} title="Analytics" open={analyticsOpen}>
      <StatsTable
        columns={['Level', 'Tiles loaded', 'Errors']}
        rows={levelStats}
        emptyText="No tiles loaded yet"
        renderRow={(stats) => (
          <tr key={stats.level} className="stats-table-row" onClick={() => flyToLevel(stats)}>
            <td>{stats.level}</td>
            <td>{stats.loaded}</td>
            <td className={stats.errors > 0 ? 'stats-table-error' : ''}>{stats.errors}</td>
          </tr>
        )}
      />
    </Panel>
  );
}
