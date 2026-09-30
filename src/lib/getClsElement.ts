import type { CLSMetric } from 'web-vitals';

export function getClsElement(metric: CLSMetric): Element | null {
  let worstEntry: LayoutShift | undefined;
  let worstSource: LayoutShiftAttribution | undefined;
  let worstArea = -1;

  for (const entry of metric.entries) {
    if (!worstEntry || entry.value > worstEntry.value) {
      worstEntry = entry;
    }
  }

  if (!worstEntry?.sources?.length) {
    return null;
  }

  for (const source of worstEntry.sources) {
    const area = Math.max(
      source.previousRect.width * source.previousRect.height,
      source.currentRect.width * source.currentRect.height,
    );

    if (area > worstArea) {
      worstArea = area;
      worstSource = source;
    }
  }

  return worstSource?.node instanceof Element ? worstSource.node : null;
}
