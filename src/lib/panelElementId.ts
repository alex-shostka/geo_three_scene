import type { PanelId } from '../store/uiSlice';

export function panelElementId(panel: PanelId): string {
  return `${panel}-panel`;
}
