import { Rectangle } from 'cesium';
import AnalyticsIcon from '../assets/icons/analytics.svg?react';
import { useViewer } from '../cesium/viewerStore';
import { ANALYTICS_PANEL } from '../constants';
import { useAppSelector } from '../store/hooks';
import { selectLevelStats, type LevelStats } from '../store/tilesSlice';
import { Panel } from './ui/Panel';
import { StatsTable } from './ui/StatsTable';
import { usePanel } from './usePanel';

export function AnalyticsPanel() {
  const panel = usePanel(ANALYTICS_PANEL);
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
    <Panel {...panel}>
      <Panel.Trigger id="analytics-btn" label="Analytics">
        <AnalyticsIcon aria-hidden="true" />
      </Panel.Trigger>
      <Panel.Content title="Analytics">
        <StatsTable
          columns={['Level', 'Tiles loaded', 'Errors']}
          rows={levelStats}
          emptyText="No tiles loaded yet"
          renderRow={(stats) => (
            <StatsTable.Row key={stats.level} onClick={() => flyToLevel(stats)}>
              <td>{stats.level}</td>
              <td>{stats.loaded}</td>
              <td className={stats.errors > 0 ? 'stats-table-error' : ''}>{stats.errors}</td>
            </StatsTable.Row>
          )}
        />
      </Panel.Content>
    </Panel>
  );
}
