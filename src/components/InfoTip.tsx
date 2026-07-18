import { useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useSettings } from '../state/SettingsContext';

interface InfoTipProps {
  text: string;
}

const BUBBLE_WIDTH = 150;
const VIEWPORT_MARGIN = 8;
const ARROW_MARGIN = 12;

export function InfoTip({ text }: InfoTipProps) {
  const { showTooltips } = useSettings();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number; arrowLeft: number } | null>(null);

  const show = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const half = BUBBLE_WIDTH / 2;
    const clampedCenterX = Math.min(
      Math.max(centerX, VIEWPORT_MARGIN + half),
      window.innerWidth - VIEWPORT_MARGIN - half,
    );
    // Keep the little arrow pointing at the trigger even when the bubble
    // itself gets clamped to stay on-screen.
    const arrowLeft = Math.min(
      Math.max(centerX - clampedCenterX + half, ARROW_MARGIN),
      BUBBLE_WIDTH - ARROW_MARGIN,
    );

    setPos({ left: clampedCenterX, top: rect.top, arrowLeft });
  };

  const hide = () => setPos(null);

  if (!showTooltips) return null;

  return (
    <span
      ref={triggerRef}
      className="info-tip"
      tabIndex={0}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <text x="8" y="11.3" textAnchor="middle" fontSize="9" fill="currentColor">?</text>
      </svg>
      {pos && createPortal(
        <span
          className="info-tip-bubble"
          role="tooltip"
          style={{
            left: pos.left,
            top: pos.top,
            '--arrow-left': `${pos.arrowLeft}px`,
          } as CSSProperties}
        >
          {text}
        </span>,
        document.body,
      )}
    </span>
  );
}
