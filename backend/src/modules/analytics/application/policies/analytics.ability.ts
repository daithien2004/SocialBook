import type { AbilityDefinition } from '@/shared/casl/ability.factory';

export const defineAnalyticsAbilities: AbilityDefinition = (
  _principal,
  builder,
) => {
  builder.can('read', 'Analytics');
  builder.can('create', 'Analytics');
};
