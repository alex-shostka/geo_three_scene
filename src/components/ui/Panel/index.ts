import { PanelContent } from './PanelContent';
import { PanelRoot } from './PanelRoot';
import { PanelSection } from './PanelSection';
import { PanelTrigger } from './PanelTrigger';

export const Panel = Object.assign(PanelRoot, {
  Trigger: PanelTrigger,
  Content: PanelContent,
  Section: PanelSection,
});
