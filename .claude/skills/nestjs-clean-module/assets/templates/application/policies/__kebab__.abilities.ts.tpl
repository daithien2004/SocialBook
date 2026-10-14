import { AbilityBuilder } from '@casl/ability';
import { AppAbility } from '@/shared/casl/app-ability';
import { AuthUser } from '@/shared/casl/auth-user';

// Gọi hàm này trong shared/casl/ability.factory.ts để gộp quyền của module vào ability.
export function define__Name__Abilities(user: AuthUser, { can }: AbilityBuilder<AppAbility>): void {
  if (user.roles.includes('admin')) {
    can('manage', '__Name__');
    return;
  }
  can('create', '__Name__');
  can(['read', 'update'], '__Name__', { ownerId: user.id });
}
