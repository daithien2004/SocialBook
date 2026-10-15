import { AbilityBuilder } from '@casl/ability';
import type { AbilityDefinition } from '@/shared/casl/ability.factory';
import type { AppAbility } from '@/shared/casl/app-ability';

export const defineReviewAbilities: AbilityDefinition = (
  principal,
  builder: AbilityBuilder<AppAbility>,
) => {
  const { can } = builder;
  can('read', 'Review', { moderationStatus: 'approved' });

  if (principal.userId !== 'anonymous') {
    can('create', 'Review');
    can('read', 'Review', { userId: principal.userId });
    can('update', 'Review', { userId: principal.userId });
    can('delete', 'Review', { userId: principal.userId });
    can('like', 'Review', { moderationStatus: 'approved' });
  }

  if (principal.roles.includes('admin')) can('manage', 'Review');
};
