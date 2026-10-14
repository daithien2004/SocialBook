import { AbilityBuilder } from '@casl/ability';
import type { AbilityDefinition } from '@/shared/casl/ability.factory';
import type { AppAbility } from '@/shared/casl/app-ability';

export const defineUserAbilities: AbilityDefinition = (
  principal,
  builder: AbilityBuilder<AppAbility>,
) => {
  builder.can('read', 'User', { id: principal.userId });
  if (principal.roles.includes('admin')) {
    builder.can('manage', 'User');
  }
};
