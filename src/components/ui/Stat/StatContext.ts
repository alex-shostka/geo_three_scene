import { createContext, use } from 'react';

interface StatClasses {
  root: string;
  label: string;
  value: string;
}

export const STAT_VARIANTS = {
  footer: { root: 'footer-stat', label: 'fs-label', value: 'fs-value' },
  gauge: { root: 'gauge-block', label: 'gauge-label', value: 'gauge-value' },
} satisfies Record<string, StatClasses>;

export type StatVariant = keyof typeof STAT_VARIANTS;

export const StatContext = createContext<StatClasses | null>(null);

export function useStatClasses(): StatClasses {
  const classes = use(StatContext);

  if (!classes) {
    throw new Error('Stat.* must be rendered inside <Stat>');
  }

  return classes;
}
