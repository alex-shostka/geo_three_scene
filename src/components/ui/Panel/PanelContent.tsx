import type { ReactNode } from 'react';
import { ErrorBoundary } from '../../ErrorBoundary';
import { usePanelContext } from './PanelContext';
import { PanelError } from './PanelError';

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
      <div className="panel-content">
        <ErrorBoundary fallback={(error, reset) => <PanelError error={error} onRetry={reset} />}>
          {children}
        </ErrorBoundary>
      </div>
    </aside>
  );
}
