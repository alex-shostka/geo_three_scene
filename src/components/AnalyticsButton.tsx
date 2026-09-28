import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectIsPanelOpen, togglePanel } from '../store/uiSlice';

export function AnalyticsButton() {
  const analyticsOpen = useAppSelector((s) => selectIsPanelOpen(s, 'analytics'));
  const dispatch = useAppDispatch();

  return (
    <button
      id="analytics-btn"
      aria-label="Analytics"
      aria-expanded={analyticsOpen}
      onClick={() => dispatch(togglePanel('analytics'))}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <rect x="4" y="13" width="4" height="7" rx="1" fill="currentColor" />
        <rect x="10" y="8" width="4" height="12" rx="1" fill="currentColor" />
        <rect x="16" y="4" width="4" height="16" rx="1" fill="currentColor" />
      </svg>
    </button>
  );
}
