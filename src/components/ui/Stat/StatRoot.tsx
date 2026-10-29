import type { ReactNode } from 'react';
import { STAT_VARIANTS, StatContext, type StatVariant } from './StatContext';

interface StatRootProps {
  variant?: StatVariant;
  children: ReactNode;
}

export function StatRoot({ variant = 'footer', children }: StatRootProps) {
  const classes = STAT_VARIANTS[variant];

  return (
    <StatContext value={classes}>
      <div className={classes.root}>{children}</div>
    </StatContext>
  );
}
