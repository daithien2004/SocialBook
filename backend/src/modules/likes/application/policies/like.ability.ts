import type { AbilityDefinition } from '@/shared/casl/ability.factory';

export const defineLikeAbilities: AbilityDefinition = (principal, builder) => {
  const { can } = builder;
  can('read', 'Like');

  if (principal.userId !== 'anonymous') {
    can('like', 'Like');
    can('update', 'Like', { userId: principal.userId });
  }

  if (principal.roles.includes('admin')) can('manage', 'Like');
};
