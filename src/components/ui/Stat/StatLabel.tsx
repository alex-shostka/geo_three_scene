import type { ReactNode } from 'react';
import { useStatClasses } from './StatContext';

interface StatLabelProps {
  children: ReactNode;
}

export function StatLabel({ children }: StatLabelProps) {
  const classes = useStatClasses();

  return <span className={classes.label}>{children}</span>;
}
