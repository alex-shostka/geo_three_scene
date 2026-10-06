import NetworkIcon from '../assets/icons/network.svg?react';
import { NETWORK_PANEL } from '../constants';
import { PanelToggleButton } from './PanelToggleButton';

export function NetworkButton() {
  return (
    <PanelToggleButton id="network-btn" panel={NETWORK_PANEL} label="Network">
      <NetworkIcon aria-hidden="true" />
    </PanelToggleButton>
  );
}
