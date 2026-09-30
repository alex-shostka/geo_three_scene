const HIGHLIGHT_DURATION_MS = 1600;
const HIGHLIGHT_OUTLINE = '3px solid #3b82f6';
const HIGHLIGHT_OUTLINE_OFFSET = '2px';

export function highlightElement(element: Element): void {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  element.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const previousOutline = element.style.outline;
  const previousOutlineOffset = element.style.outlineOffset;

  element.style.outline = HIGHLIGHT_OUTLINE;
  element.style.outlineOffset = HIGHLIGHT_OUTLINE_OFFSET;

  window.setTimeout(() => {
    element.style.outline = previousOutline;
    element.style.outlineOffset = previousOutlineOffset;
  }, HIGHLIGHT_DURATION_MS);
}
