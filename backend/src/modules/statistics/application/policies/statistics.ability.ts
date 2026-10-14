import { AbilityBuilder } from '@casl/ability';
import type { AbilityDefinition } from '@/shared/casl/ability.factory';
import type { AppAbility } from '@/shared/casl/app-ability';

export const defineStatisticsAbilities: AbilityDefinition = (
  principal,
  builder: AbilityBuilder<AppAbility>,
) => {
  const { can } = builder;

  if (principal.roles.includes('admin') || principal.roles.includes('editor')) {
    can('read', 'Statistics');
  }
};
