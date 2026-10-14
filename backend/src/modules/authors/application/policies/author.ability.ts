import { AbilityBuilder } from '@casl/ability';
import type { AbilityDefinition } from '@/shared/casl/ability.factory';
import type { AppAbility } from '@/shared/casl/app-ability';

export const defineAuthorAbilities: AbilityDefinition = (
  principal,
  builder: AbilityBuilder<AppAbility>,
) => {
  const { can } = builder;
  can('read', 'Author');
  if (principal.roles.includes('admin')) {
    can('manage', 'Author');
    can('manage', 'AuthorAdministration');
  }
};
