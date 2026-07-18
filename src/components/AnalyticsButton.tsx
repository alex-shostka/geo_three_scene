import { useUi } from '../state/UiContext';

export function AnalyticsButton() {
  const { analyticsOpen, toggleAnalytics } = useUi();

  return (
    <button
      id="analytics-btn"
      aria-label="Analytics"
      aria-expanded={analyticsOpen}
      onClick={toggleAnalytics}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <rect x="4" y="13" width="4" height="7" rx="1" fill="currentColor" />
        <rect x="10" y="8" width="4" height="12" rx="1" fill="currentColor" />
        <rect x="16" y="4" width="4" height="16" rx="1" fill="currentColor" />
      </svg>
    </button>
  );
}
