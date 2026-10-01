export function startPointerDrag(
  event: React.PointerEvent,
  onFrame: (clientX: number, clientY: number) => void,
  onEnd?: () => void,
) {
  const prevUserSelect = document.body.style.userSelect;
  let rafId = 0;
  let pendingX = event.clientX;
  let pendingY = event.clientY;

  const applyFrame = () => {
    rafId = 0;
    onFrame(pendingX, pendingY);
  };

  const onPointerMove = (moveEvent: PointerEvent) => {
    pendingX = moveEvent.clientX;
    pendingY = moveEvent.clientY;

    if (!rafId) {
      rafId = requestAnimationFrame(applyFrame);
    }
  };

  const onPointerUp = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }

    document.body.style.userSelect = prevUserSelect;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    onEnd?.();
  };

  event.preventDefault();
  document.body.style.userSelect = 'none';
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
}
