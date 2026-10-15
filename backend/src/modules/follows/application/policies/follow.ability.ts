import type { AbilityDefinition } from '@/shared/casl/ability.factory';

export const defineFollowAbilities: AbilityDefinition = (
  principal,
  builder,
) => {
  const { can } = builder;
  can('read', 'Follow');

  if (principal.userId === 'anonymous') return;

  can('create', 'Follow', { userId: principal.userId });
  can('update', 'Follow', { userId: principal.userId });
};
