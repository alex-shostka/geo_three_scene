import NetworkIcon from '../assets/icons/network.svg?react';
import { NETWORK_PANEL } from '../constants';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectIsPanelOpen, togglePanel } from '../store/uiSlice';

export function NetworkButton() {
  const networkOpen = useAppSelector((s) => selectIsPanelOpen(s, NETWORK_PANEL));
  const dispatch = useAppDispatch();

  return (
    <button
      id="network-btn"
      aria-label="Network"
      aria-expanded={networkOpen}
      onClick={() => dispatch(togglePanel(NETWORK_PANEL))}
    >
      <NetworkIcon aria-hidden="true" />
    </button>
  );
}
