import { MENU_PANEL } from '../constants';
import { PanelToggleButton } from './PanelToggleButton';

export function HamburgerMenu() {
  return (
    <PanelToggleButton id="menu-btn" panel={MENU_PANEL} label="Menu">
      <span></span>
      <span></span>
      <span></span>
    </PanelToggleButton>
  );
}
