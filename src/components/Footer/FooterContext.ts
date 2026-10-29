import { createContext, use } from 'react';

interface FooterContextValue {
  open: boolean;
  toggle: () => void;
  contentId: string;
}

export const FooterContext = createContext<FooterContextValue | null>(null);

export function useFooterContext(): FooterContextValue {
  const context = use(FooterContext);

  if (!context) {
    throw new Error('Footer.* must be rendered inside <Footer>');
  }

  return context;
}
