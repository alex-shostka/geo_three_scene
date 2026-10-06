import AnalyticsIcon from '../assets/icons/analytics.svg?react';
import { ANALYTICS_PANEL } from '../constants';
import { PanelToggleButton } from './PanelToggleButton';

export function AnalyticsButton() {
  return (
    <PanelToggleButton id="analytics-btn" panel={ANALYTICS_PANEL} label="Analytics">
      <AnalyticsIcon aria-hidden="true" />
    </PanelToggleButton>
  );
}
