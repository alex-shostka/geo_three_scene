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
import { DoomStatusHint } from './DoomStatusHint';
import { Panel } from './ui/Panel';
import { Settings } from './ui/Settings';
import { usePanel } from './usePanel';

export function SidePanel() {
  const panel = usePanel(MENU_PANEL);
  const settings = useAppSelector(selectSettings);
  const dispatch = useAppDispatch();

  return (
    <Panel {...panel}>
      <Panel.Trigger id="menu-btn" label="Menu">
        <span></span>
        <span></span>
        <span></span>
      </Panel.Trigger>
      <Panel.Content title="Menu">
        <Settings>
          <Settings.Group
            label="Active tiles in scene"
            checked={settings.activeTilesOnScene}
            onChange={(checked) => dispatch(setActiveTilesOnScene(checked))}
          >
            <Settings.Toggle
              label="Fly to tile on click"
              checked={settings.flyToTile}
              onChange={(checked) => dispatch(setFlyToTile(checked))}
            />
          </Settings.Group>

          <Settings.Toggle
            label="Tile grid on globe"
            checked={settings.tileGridOnGlobe}
            onChange={(checked) => dispatch(setTileGridOnGlobe(checked))}
          />

          <Settings.Group
            label="GLB tiles (3D)"
            checked={settings.glbTiles}
            onChange={(checked) => dispatch(setGlbTiles(checked))}
          >
            <Settings.Toggle
              label="Enable GLB metadata"
              checked={settings.glbMetadata}
              onChange={(checked) => dispatch(setGlbMetadata(checked))}
            />
          </Settings.Group>

          <Settings.Toggle
            label="Show tooltips"
            checked={settings.showTooltips}
            onChange={(checked) => dispatch(setShowTooltips(checked))}
          />
          <Settings.Toggle
            label="Play DOOM"
            checked={settings.playDoom}
            onChange={(checked) => dispatch(setPlayDoom(checked))}
          />

          <DoomStatusHint />
        </Settings>
      </Panel.Content>
    </Panel>
  );
}
