import { useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import QuestionIcon from '../assets/icons/question.svg?react';
import { useAppSelector } from '../store/hooks';
import { selectShowTooltips } from '../store/settingsSlice';

interface InfoTipProps {
  text: string;
}

const BUBBLE_WIDTH = 150;
const VIEWPORT_MARGIN = 8;
const ARROW_MARGIN = 12;

export function InfoTip({ text }: InfoTipProps) {
  const showTooltips = useAppSelector(selectShowTooltips);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number; arrowLeft: number } | null>(null);

  const show = () => {
    const rect = triggerRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const centerX = rect.left + rect.width / 2;
    const half = BUBBLE_WIDTH / 2;
    const clampedCenterX = Math.min(
      Math.max(centerX, VIEWPORT_MARGIN + half),
      window.innerWidth - VIEWPORT_MARGIN - half,
    );
    const arrowLeft = Math.min(Math.max(centerX - clampedCenterX + half, ARROW_MARGIN), BUBBLE_WIDTH - ARROW_MARGIN);

    setPos({ left: clampedCenterX, top: rect.top, arrowLeft });
  };

  const hide = () => setPos(null);

  if (!showTooltips) {
    return null;
  }

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
      <QuestionIcon aria-hidden="true" />
      {pos &&
        createPortal(
          <span
            className="info-tip-bubble"
            role="tooltip"
            style={{
              left: pos.left,
              top: pos.top,
              '--arrow-left': `${pos.arrowLeft}px`,
            }}
          >
            {text}
          </span>,
          document.body,
        )}
    </span>
  );
}
