import { useUi } from '../state/UiContext';

export function HamburgerMenu() {
  const { menuOpen, toggleMenu } = useUi();

  return (
    <button id="menu-btn" aria-label="Menu" aria-expanded={menuOpen} onClick={toggleMenu}>
      <span></span><span></span><span></span>
    </button>
  );
}
