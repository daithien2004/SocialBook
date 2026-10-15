import type { AbilityDefinition } from '@/shared/casl/ability.factory';

export const defineUserHighlightAbilities: AbilityDefinition = (
  principal,
  builder,
) => {
  const { can } = builder;
  if (principal.userId === 'anonymous') return;

  can('create', 'UserHighlight', { userId: principal.userId });
  can('read', 'UserHighlight', { userId: principal.userId });
  can('update', 'UserHighlight', { userId: principal.userId });
  can('delete', 'UserHighlight', { userId: principal.userId });
};
