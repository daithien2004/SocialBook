import { AbilityBuilder } from '@casl/ability';
import type { AbilityDefinition } from '@/shared/casl/ability.factory';
import type { AppAbility } from '@/shared/casl/app-ability';

export const defineChapterAbilities: AbilityDefinition = (
  principal,
  builder: AbilityBuilder<AppAbility>,
) => {
  const { can } = builder;
  can('read', 'Chapter', { isDeleted: false });

  if (principal.roles.includes('admin')) {
    can('manage', 'Chapter');
  }
};
