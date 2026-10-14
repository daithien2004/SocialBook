import { AbilityBuilder } from '@casl/ability';
import type { AbilityPrincipal } from '@/shared/casl/ability.factory';
import type { AppAbility } from '@/shared/casl/app-ability';

export function defineBookmarkAbilities(
  principal: AbilityPrincipal,
  builder: AbilityBuilder<AppAbility>,
): void {
  const { can } = builder;
  if (principal.roles.includes('admin')) {
    can('manage', 'all');
    return;
  }

  can('create', 'Bookmark');
  can('read', 'Bookmark', { userId: principal.userId });
  can('delete', 'Bookmark', { userId: principal.userId });
}
