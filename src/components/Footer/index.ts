import { FooterBar } from './FooterBar';
import { FooterContent } from './FooterContent';
import { FooterRoot } from './FooterRoot';
import { FooterToggle } from './FooterToggle';

export const Footer = Object.assign(FooterRoot, {
  Bar: FooterBar,
  Toggle: FooterToggle,
  Content: FooterContent,
});
