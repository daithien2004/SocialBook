import { AbilityBuilder } from '@casl/ability';
import type { AbilityDefinition } from '@/shared/casl/ability.factory';
import type { AppAbility } from '@/shared/casl/app-ability';

export const defineCommentAbilities: AbilityDefinition = (
  principal,
  builder: AbilityBuilder<AppAbility>,
) => {
  const { can } = builder;
  can('read', 'Comment', {
    isDeleted: false,
    moderationStatus: 'approved',
  });

  if (principal.userId !== 'anonymous') {
    can('create', 'Comment');
    can('read', 'Comment', { isDeleted: false, userId: principal.userId });
    can('update', 'Comment', { isDeleted: false, userId: principal.userId });
    can('delete', 'Comment', { isDeleted: false, userId: principal.userId });
  }

  if (principal.roles.includes('admin')) can('manage', 'Comment');
};
