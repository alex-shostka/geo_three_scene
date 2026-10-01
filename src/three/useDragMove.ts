import { useCallback, type RefObject } from 'react';
import { EDGE_MARGIN } from './overlayEdgeMargin';
import { startPointerDrag } from './startPointerDrag';

export function useDragMove(containerRef: RefObject<HTMLDivElement | null>) {
  return useCallback(
    (event: React.PointerEvent) => {
      const container = containerRef.current;

      if (!container) {
        return;
      }

      const startRect = container.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;

      const applyMove = (clientX: number, clientY: number) => {
        const dx = clientX - startX;
        const dy = clientY - startY;

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

      startPointerDrag(event, applyMove);
    },
    [containerRef],
  );
}
