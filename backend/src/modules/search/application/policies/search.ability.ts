import type { AbilityDefinition } from '@/shared/casl/ability.factory';

export const defineSearchAbilities: AbilityDefinition = (
  _principal,
  builder,
) => {
  const { can } = builder;
  can('read', 'Search');
  can('create', 'Search');
};
