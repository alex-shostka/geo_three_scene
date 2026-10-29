import type { ReactNode } from 'react';

interface StatHeadingProps {
  children: ReactNode;
}

export function StatHeading({ children }: StatHeadingProps) {
  return <span className="label-row">{children}</span>;
}
