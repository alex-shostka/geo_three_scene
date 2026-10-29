import type { ReactNode } from 'react';

interface PanelSectionProps {
  title: string;
  children: ReactNode;
}

export function PanelSection({ title, children }: PanelSectionProps) {
  return (
    <section>
      <div className="panel-section-title">{title}</div>
      {children}
    </section>
  );
}
