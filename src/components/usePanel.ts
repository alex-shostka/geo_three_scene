import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectIsPanelOpen, togglePanel, type PanelId } from '../store/uiSlice';

export function usePanel(panel: PanelId) {
  const open = useAppSelector((s) => selectIsPanelOpen(s, panel));
  const dispatch = useAppDispatch();

  return {
    id: `${panel}-panel`,
    open,
    onToggle: () => dispatch(togglePanel(panel)),
  };
}
