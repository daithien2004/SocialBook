import type { AbilityDefinition } from '@/shared/casl/ability.factory';

export const defineChromaAbilities: AbilityDefinition = (
  principal,
  builder,
) => {
  const { can } = builder;
  can('read', 'Search');
  can('create', 'Search');
  can('create', 'AIRequest');

  if (principal.roles.includes('admin')) {
    can('manage', 'Search');
  }
};
