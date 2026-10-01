import { useCallback, type RefObject } from 'react';
import { EDGE_MARGIN } from './overlayEdgeMargin';
import { startPointerDrag } from './startPointerDrag';

const MIN_WIDTH = 320;
const MIN_HEIGHT = 220;
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
  return useCallback(
    (corner: ResizeCorner) => (event: React.PointerEvent) => {
      const container = containerRef.current;

      if (!container) {
        return;
      }

      const startRect = container.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      let finalBox: Box = {
        width: startRect.width,
        height: startRect.height,
        top: startRect.top,
        left: startRect.left,
      };

      const growsRight = corner === 'se' || corner === 'ne';
      const growsDown = corner === 'se' || corner === 'sw';
      const anchorLeft = growsRight ? startRect.left : startRect.right;
      const anchorTop = growsDown ? startRect.top : startRect.bottom;
      const startFreeX = growsRight ? startRect.right : startRect.left;
      const startFreeY = growsDown ? startRect.bottom : startRect.top;

      const computeBox = (clientX: number, clientY: number): Box => {
        const dx = applyDeadZone(clientX - startX);
        const dy = applyDeadZone(clientY - startY);

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

      const applyPreview = (clientX: number, clientY: number) => {
        const box = computeBox(clientX, clientY);

        finalBox = box;

        const scaleX = box.width / startRect.width;
        const scaleY = box.height / startRect.height;
        const translateX = box.left - startRect.left;
        const translateY = box.top - startRect.top;

        container.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
      };

      const commitSize = () => {
        Object.assign(container.style, {
          width: `${finalBox.width}px`,
          height: `${finalBox.height}px`,
          top: `${finalBox.top}px`,
          left: `${finalBox.left}px`,
          right: 'auto',
        });
        setSizeRef.current?.(finalBox.width, finalBox.height, finalBox.top, finalBox.left);
        container.style.transform = 'none';
      };

      container.style.transformOrigin = '0 0';
      startPointerDrag(event, applyPreview, commitSize);
    },
    [containerRef, setSizeRef],
  );
}
