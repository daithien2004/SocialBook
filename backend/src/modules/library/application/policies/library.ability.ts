import { AbilityBuilder } from '@casl/ability';
import type { AbilityDefinition } from '@/shared/casl/ability.factory';
import type { AppAbility } from '@/shared/casl/app-ability';

export const defineLibraryAbilities: AbilityDefinition = (
  principal,
  builder: AbilityBuilder<AppAbility>,
) => {
  builder.can('manage', 'Library', { userId: principal.userId });
  builder.can('create', 'LibraryCollection');
  builder.can('read', 'LibraryCollection', { isPublic: true });
  builder.can('manage', 'LibraryCollection', { userId: principal.userId });

  if (principal.roles.includes('admin')) {
    builder.can('manage', 'Library');
    builder.can('manage', 'LibraryCollection');
  }
};
