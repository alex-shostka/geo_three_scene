import { useUi } from '../state/UiContext';
import { useSettings } from '../state/SettingsContext';
import { SettingsToggleItem } from './SettingsToggleItem';

export function SidePanel() {
  const { menuOpen } = useUi();
  const settings = useSettings();

  return (
    <aside id="side-panel" className={menuOpen ? 'open' : ''}>
      <div id="side-panel-header">
        <span id="side-panel-title">Menu</span>
      </div>
      <div id="side-panel-content">
        <ul className="settings-list">
          <SettingsToggleItem
            label="Active tiles in scene"
            checked={settings.activeTilesOnScene}
            onChange={settings.setActiveTilesOnScene}
          />
          <SettingsToggleItem
            label="Fly to tile on click"
            checked={settings.flyToTile}
            disabled={!settings.activeTilesOnScene}
            onChange={settings.setFlyToTile}
            child
          />
          <SettingsToggleItem
            label="Tile grid on globe"
            checked={settings.tileGridOnGlobe}
            onChange={settings.setTileGridOnGlobe}
          />
          <SettingsToggleItem
            label="GLB tiles (3D)"
            checked={settings.glbTiles}
            onChange={settings.setGlbTiles}
          />
          <SettingsToggleItem
            label="Enable GLB metadata"
            checked={settings.glbMetadata}
            disabled={!settings.glbTiles}
            onChange={settings.setGlbMetadata}
            child
          />
          <SettingsToggleItem
            label="Show tooltips"
            checked={settings.showTooltips}
            onChange={settings.setShowTooltips}
          />
          <SettingsToggleItem
            label="Play DOOM"
            checked={settings.playDoom}
            onChange={settings.setPlayDoom}
          />
        </ul>
      </div>
    </aside>
  );
}
