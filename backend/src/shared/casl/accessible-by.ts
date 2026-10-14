import { accessibleBy as caslAccessibleBy } from '@casl/prisma/runtime';
import type { AppAbility } from './app-ability';

export function accessibleBy(ability: AppAbility) {
  return caslAccessibleBy(ability);
}
