import { AbilityBuilder } from '@casl/ability';
import type { AbilityDefinition } from '@/shared/casl/ability.factory';
import type { AppAbility } from '@/shared/casl/app-ability';

export const defineGenreAbilities: AbilityDefinition = (
  principal,
  builder: AbilityBuilder<AppAbility>,
) => {
  const { can } = builder;
  can('read', 'Genre');
  if (principal.roles.includes('admin')) {
    can('manage', 'Genre');
    can('manage', 'GenreAdministration');
  }
};
