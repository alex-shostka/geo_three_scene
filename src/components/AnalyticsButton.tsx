import AnalyticsIcon from '../assets/icons/analytics.svg?react';
import { ANALYTICS_PANEL } from '../constants';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectIsPanelOpen, togglePanel } from '../store/uiSlice';

export function AnalyticsButton() {
  const analyticsOpen = useAppSelector((s) => selectIsPanelOpen(s, ANALYTICS_PANEL));
  const dispatch = useAppDispatch();

  return (
    <button
      id="analytics-btn"
      aria-label="Analytics"
      aria-expanded={analyticsOpen}
      onClick={() => dispatch(togglePanel(ANALYTICS_PANEL))}
    >
      <AnalyticsIcon aria-hidden="true" />
    </button>
  );
}
