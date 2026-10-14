import { AbilityBuilder } from '@casl/ability';
import type { AbilityDefinition } from '@/shared/casl/ability.factory';
import type { AppAbility } from '@/shared/casl/app-ability';

export const defineAiConfigurationAbilities: AbilityDefinition = (
  principal,
  builder: AbilityBuilder<AppAbility>,
) => {
  if (principal.roles.includes('admin')) {
    builder.can('manage', 'AIRateLimitConfiguration');
  }
};
