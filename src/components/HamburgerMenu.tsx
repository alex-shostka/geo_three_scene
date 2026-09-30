import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectIsPanelOpen, togglePanel } from '../store/uiSlice';
import { MENU_PANEL } from '../constants';

export function HamburgerMenu() {
  const menuOpen = useAppSelector((s) => selectIsPanelOpen(s, MENU_PANEL));
  const dispatch = useAppDispatch();

  return (
    <button id="menu-btn" aria-label="Menu" aria-expanded={menuOpen} onClick={() => dispatch(togglePanel(MENU_PANEL))}>
      <span></span>
      <span></span>
      <span></span>
    </button>
  );
}
