import { useCallback, type RefObject } from 'react';
import { EDGE_MARGIN } from './overlayEdgeMargin';

export function useDragMove(containerRef: RefObject<HTMLDivElement | null>) {
  return useCallback((e: React.PointerEvent) => {
    const container = containerRef.current;
    if (!container) return;
    e.preventDefault();

    const startRect = container.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    let rafId = 0;
    let pendingX = startX;
    let pendingY = startY;

    // Position-only move never changes the container's size, so unlike the
    // corner resize there's no R3F ResizeObserver to race — plain style
    // writes every frame are safe here.
    const applyMove = () => {
      rafId = 0;
      const dx = pendingX - startX;
      const dy = pendingY - startY;

      // Math.max on the upper bound means an oversized box (bigger than the
      // viewport minus margins) pins to the top/left margin instead of the
      // range inverting and fighting the lower bound.
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

    const onPointerMove = (ev: PointerEvent) => {
      pendingX = ev.clientX;
      pendingY = ev.clientY;
      if (!rafId) rafId = requestAnimationFrame(applyMove);
    };

    const onPointerUp = () => {
      if (rafId) cancelAnimationFrame(rafId);
      document.body.style.userSelect = prevUserSelect;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }, [containerRef]);
}
