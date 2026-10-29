import { StatHeading } from './StatHeading';
import { StatLabel } from './StatLabel';
import { StatRoot } from './StatRoot';
import { StatValue } from './StatValue';

export const Stat = Object.assign(StatRoot, {
  Heading: StatHeading,
  Label: StatLabel,
  Value: StatValue,
});
