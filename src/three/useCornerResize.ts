import { useCallback, type RefObject } from 'react';
import { EDGE_MARGIN } from './overlayEdgeMargin';

const MIN_WIDTH = 320;
const MIN_HEIGHT = 220;
// Ignores tiny orthogonal drift so an intentionally sideways drag doesn't
// register as a height change (and vice versa) from hand tremor alone.
const DEAD_ZONE = 4;

function applyDeadZone(delta: number) {
  return Math.abs(delta) <= DEAD_ZONE ? 0 : delta - Math.sign(delta) * DEAD_ZONE;
}

export type ResizeCorner = 'nw' | 'ne' | 'sw' | 'se';
export type SetCanvasSize = (width: number, height: number, top?: number, left?: number) => void;
export type SetCanvasSizeRef = RefObject<SetCanvasSize | null>;

interface Box {
  width: number;
  height: number;
  top: number;
  left: number;
}

export function useCornerResize(containerRef: RefObject<HTMLDivElement | null>, setSizeRef: SetCanvasSizeRef) {
  return useCallback((corner: ResizeCorner) => (e: React.PointerEvent) => {
    const container = containerRef.current;
    if (!container) return;
    e.preventDefault();

    const startRect = container.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';
    container.style.transformOrigin = '0 0';

    let rafId = 0;
    let pendingX = startX;
    let pendingY = startY;
    let finalBox: Box = { width: startRect.width, height: startRect.height, top: startRect.top, left: startRect.left };

    // Model the drag as a fixed anchor corner (the one opposite whichever
    // corner is being dragged) plus a free point that follows the cursor.
    // Clamping the free point against both the min size and the viewport
    // margin — instead of clamping width/left separately — keeps the two
    // constraints from fighting each other at the edges.
    const growsRight = corner === 'se' || corner === 'ne';
    const growsDown = corner === 'se' || corner === 'sw';
    const anchorLeft = growsRight ? startRect.left : startRect.right;
    const anchorTop = growsDown ? startRect.top : startRect.bottom;
    // The free point tracks the dragged corner itself, which starts on the
    // opposite side from the anchor — not at the anchor.
    const startFreeX = growsRight ? startRect.right : startRect.left;
    const startFreeY = growsDown ? startRect.bottom : startRect.top;

    const computeBox = (): Box => {
      const dx = applyDeadZone(pendingX - startX);
      const dy = applyDeadZone(pendingY - startY);

      let freeX = startFreeX + dx;
      let freeY = startFreeY + dy;

      freeX = growsRight
        ? Math.min(Math.max(freeX, anchorLeft + MIN_WIDTH), window.innerWidth - EDGE_MARGIN)
        : Math.max(Math.min(freeX, anchorLeft - MIN_WIDTH), EDGE_MARGIN);
      freeY = growsDown
        ? Math.min(Math.max(freeY, anchorTop + MIN_HEIGHT), window.innerHeight - EDGE_MARGIN)
        : Math.max(Math.min(freeY, anchorTop - MIN_HEIGHT), EDGE_MARGIN);

      return {
        left: Math.min(anchorLeft, freeX),
        width: Math.abs(freeX - anchorLeft),
        top: Math.min(anchorTop, freeY),
        height: Math.abs(freeY - anchorTop),
      };
    };

    // Mid-drag we only preview the new size with a compositor-only transform
    // (translate + scale). We deliberately leave the container's real
    // width/height alone here: touching them would make R3F's own
    // ResizeObserver fire and call its internal setSize asynchronously,
    // racing our own synchronous calls and fighting over the canvas size
    // (this is what made the canvas flicker/disappear mid-drag). A
    // transform never triggers layout or ResizeObserver, so there's no
    // second source of truth to race against.
    const applyPreview = () => {
      rafId = 0;
      const box = computeBox();
      finalBox = box;
      const scaleX = box.width / startRect.width;
      const scaleY = box.height / startRect.height;
      const translateX = box.left - startRect.left;
      const translateY = box.top - startRect.top;
      container.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
    };

    const onPointerMove = (ev: PointerEvent) => {
      pendingX = ev.clientX;
      pendingY = ev.clientY;
      if (!rafId) rafId = requestAnimationFrame(applyPreview);
    };

    const onPointerUp = () => {
      if (rafId) cancelAnimationFrame(rafId);
      document.body.style.userSelect = prevUserSelect;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      Object.assign(container.style, {
        width: `${finalBox.width}px`,
        height: `${finalBox.height}px`,
        top: `${finalBox.top}px`,
        left: `${finalBox.left}px`,
        right: 'auto',
      });
      // Resize the WebGL canvas synchronously, in the same tick as the DOM
      // commit above, before dropping the preview transform — so by the
      // time the transform goes away the canvas is already the right size
      // and there's nothing left to visibly snap.
      setSizeRef.current?.(finalBox.width, finalBox.height, finalBox.top, finalBox.left);
      container.style.transform = 'none';
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }, [containerRef, setSizeRef]);
}
