import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectIsPanelOpen, togglePanel } from '../store/uiSlice';

export function HamburgerMenu() {
  const menuOpen = useAppSelector((s) => selectIsPanelOpen(s, 'menu'));
  const dispatch = useAppDispatch();

  return (
    <button id="menu-btn" aria-label="Menu" aria-expanded={menuOpen} onClick={() => dispatch(togglePanel('menu'))}>
      <span></span><span></span><span></span>
    </button>
  );
}
