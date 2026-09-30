import { useCallback, type RefObject } from 'react';
import { EDGE_MARGIN } from './overlayEdgeMargin';

export function useDragMove(containerRef: RefObject<HTMLDivElement | null>) {
  return useCallback((event: React.PointerEvent) => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const startRect = container.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const prevUserSelect = document.body.style.userSelect;
    let rafId = 0;
    let pendingX = startX;
    let pendingY = startY;

    const applyMove = () => {
      rafId = 0;

      const dx = pendingX - startX;
      const dy = pendingY - startY;

      const minTop = EDGE_MARGIN;
      const maxTop = Math.max(EDGE_MARGIN, window.innerHeight - EDGE_MARGIN - startRect.height);
      const minLeft = EDGE_MARGIN;
      const maxLeft = Math.max(EDGE_MARGIN, window.innerWidth - EDGE_MARGIN - startRect.width);

      const top = Math.min(Math.max(startRect.top + dy, minTop), maxTop);
      const left = Math.min(Math.max(startRect.left + dx, minLeft), maxLeft);

      Object.assign(container.style, {
        top: `${top}px`,
        left: `${left}px`,
        right: 'auto',
      });
    };

    const onPointerMove = (moveEvent: PointerEvent) => {
      pendingX = moveEvent.clientX;
      pendingY = moveEvent.clientY;

      if (!rafId) {
        rafId = requestAnimationFrame(applyMove);
      }
    };

    const onPointerUp = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }

      document.body.style.userSelect = prevUserSelect;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    event.preventDefault();
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }, [containerRef]);
}
