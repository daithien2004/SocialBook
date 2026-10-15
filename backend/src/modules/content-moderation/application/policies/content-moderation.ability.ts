import type { AbilityDefinition } from '@/shared/casl/ability.factory';

export const defineContentModerationAbilities: AbilityDefinition = (
  principal,
  builder,
) => {
  if (principal.roles.includes('admin')) {
    builder.can('manage', 'ToxicWord');
  }
};
