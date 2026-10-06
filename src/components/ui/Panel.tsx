import type { ReactNode } from 'react';

interface PanelProps {
  id: string;
  title: string;
  open: boolean;
  children: ReactNode;
}

export function Panel({ id, title, open, children }: PanelProps) {
  const titleId = `${id}-title`;

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
