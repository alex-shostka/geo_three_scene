import { MENU_PANEL } from '../constants';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectSettings,
  setActiveTilesOnScene,
  setFlyToTile,
  setGlbMetadata,
  setGlbTiles,
  setPlayDoom,
  setShowTooltips,
  setTileGridOnGlobe,
} from '../store/settingsSlice';
import { selectIsPanelOpen } from '../store/uiSlice';
import { SettingsToggleItem } from './SettingsToggleItem';

export function SidePanel() {
  const menuOpen = useAppSelector((s) => selectIsPanelOpen(s, MENU_PANEL));
  const settings = useAppSelector(selectSettings);
  const dispatch = useAppDispatch();

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
            onChange={(v) => dispatch(setActiveTilesOnScene(v))}
          />
          <SettingsToggleItem
            label="Fly to tile on click"
            checked={settings.flyToTile}
            disabled={!settings.activeTilesOnScene}
            onChange={(v) => dispatch(setFlyToTile(v))}
            child
          />
          <SettingsToggleItem
            label="Tile grid on globe"
            checked={settings.tileGridOnGlobe}
            onChange={(v) => dispatch(setTileGridOnGlobe(v))}
          />
          <SettingsToggleItem
            label="GLB tiles (3D)"
            checked={settings.glbTiles}
            onChange={(v) => dispatch(setGlbTiles(v))}
          />
          <SettingsToggleItem
            label="Enable GLB metadata"
            checked={settings.glbMetadata}
            disabled={!settings.glbTiles}
            onChange={(v) => dispatch(setGlbMetadata(v))}
            child
          />
          <SettingsToggleItem
            label="Show tooltips"
            checked={settings.showTooltips}
            onChange={(v) => dispatch(setShowTooltips(v))}
          />
          <SettingsToggleItem
            label="Play DOOM"
            checked={settings.playDoom}
            onChange={(v) => dispatch(setPlayDoom(v))}
          />
        </ul>
      </div>
    </aside>
  );
}
