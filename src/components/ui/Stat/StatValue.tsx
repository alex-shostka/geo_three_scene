import type { ReactNode } from 'react';
import { useStatClasses } from './StatContext';

interface StatValueProps {
  children: ReactNode;
}

export function StatValue({ children }: StatValueProps) {
  const classes = useStatClasses();

  return <span className={classes.value}>{children}</span>;
}
