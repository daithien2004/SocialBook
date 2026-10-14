import { AbilityBuilder } from '@casl/ability';
import type { AbilityDefinition } from '@/shared/casl/ability.factory';
import type { AppAbility } from '@/shared/casl/app-ability';

export const defineBookAbilities: AbilityDefinition = (
  principal,
  builder: AbilityBuilder<AppAbility>,
) => {
  const { can } = builder;
  can('read', 'Book', { status: 'published', isDeleted: false });

  if (principal.userId !== 'anonymous') {
    can('like', 'Book', { status: 'published', isDeleted: false });
  }

  if (principal.roles.includes('admin')) {
    can('manage', 'Book');
  }
};
