import type { ReactNode } from 'react';
import { usePanelContext } from './PanelContext';

interface PanelProps {
  title: string;
  children: ReactNode;
}

export function PanelContent({ title, children }: PanelProps) {
  const { id, titleId, open } = usePanelContext();

  return (
    <aside id={id} className={open ? 'panel open' : 'panel'} aria-labelledby={titleId} inert={!open}>
      <div className="panel-header">
        <span id={titleId} className="panel-title">
          {title}
        </span>
      </div>
      <div className="panel-content">{children}</div>
    </aside>
  );
}
