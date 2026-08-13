const HIGHLIGHT_DURATION_MS = 1600;

export function highlightElement(element: Element): void {
  if (!(element instanceof HTMLElement)) return;
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const previousOutline = element.style.outline;
  const previousOutlineOffset = element.style.outlineOffset;
  element.style.outline = '3px solid #3b82f6';
  element.style.outlineOffset = '2px';

  window.setTimeout(() => {
    element.style.outline = previousOutline;
    element.style.outlineOffset = previousOutlineOffset;
  }, HIGHLIGHT_DURATION_MS);
}
