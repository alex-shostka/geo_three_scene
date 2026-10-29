import { createContext, use } from 'react';

export const STAT_VARIANTS = {
  footer: { root: 'footer-stat', label: 'fs-label', value: 'fs-value' },
  gauge: { root: 'gauge-block', label: 'gauge-label', value: 'gauge-value' },
} as const;

export type StatVariant = keyof typeof STAT_VARIANTS;

type StatClasses = (typeof STAT_VARIANTS)[StatVariant];

export const StatContext = createContext<StatClasses | null>(null);

export function useStatClasses(): StatClasses {
  const classes = use(StatContext);

  if (!classes) {
    throw new Error('Stat.* must be rendered inside <Stat>');
  }

  return classes;
}
