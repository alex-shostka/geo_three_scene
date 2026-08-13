import { useUi } from '../state/UiContext';

export function NetworkButton() {
  const { networkOpen, toggleNetwork } = useUi();

  return (
    <button
      id="network-btn"
      aria-label="Network"
      aria-expanded={networkOpen}
      onClick={toggleNetwork}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="M8.5 6H15.5M8 7.5L11 15.5M16 7.5L13 15.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="6" cy="6" r="2.5" fill="currentColor" />
        <circle cx="18" cy="6" r="2.5" fill="currentColor" />
        <circle cx="12" cy="18" r="2.5" fill="currentColor" />
      </svg>
    </button>
  );
}
