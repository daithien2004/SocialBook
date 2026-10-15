import type { AbilityDefinition } from '@/shared/casl/ability.factory';

export const defineNotificationAbilities: AbilityDefinition = (
  principal,
  builder,
) => {
  const { can } = builder;

  if (principal.roles.includes('admin')) {
    can('manage', 'Notification');
    return;
  }

  if (principal.userId !== 'anonymous') {
    can('read', 'Notification', { userId: principal.userId });
    can('update', 'Notification', { userId: principal.userId });
  }
};
