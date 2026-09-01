import type { Metric } from 'web-vitals';

interface LayoutShiftAttribution {
  node?: Node | null;
  previousRect: DOMRectReadOnly;
  currentRect: DOMRectReadOnly;
}

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  sources: LayoutShiftAttribution[];
}

export function getClsElement(metric: Metric): Element | null {
  let worstEntry: LayoutShiftEntry | undefined;
  for (const entry of metric.entries as LayoutShiftEntry[]) {
    if (!worstEntry || entry.value > worstEntry.value) worstEntry = entry;
  }
  if (!worstEntry?.sources?.length) return null;

  let worstSource: LayoutShiftAttribution | undefined;
  let worstArea = -1;
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
