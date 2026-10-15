import type { AbilityDefinition } from '@/shared/casl/ability.factory';

export const definePostAbilities: AbilityDefinition = (principal, builder) => {
  const { can } = builder;

  if (principal.roles.includes('admin')) {
    can('manage', 'all');
    return;
  }

  can('read', 'Post', { isDeleted: false, isFlagged: false });

  if (principal.userId !== 'anonymous') {
    can('create', 'Post');
    can('read', 'Post', { isDeleted: false, userId: principal.userId });
    can('update', 'Post', { isDeleted: false, userId: principal.userId });
    can('delete', 'Post', { isDeleted: false, userId: principal.userId });
  }
};
