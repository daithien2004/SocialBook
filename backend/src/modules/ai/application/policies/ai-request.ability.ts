import type { AbilityDefinition } from '@/shared/casl/ability.factory';

export const defineAIRequestAbilities: AbilityDefinition = (
  principal,
  builder,
) => {
  const { can } = builder;
  can('create', 'AIRequest');

  if (principal.userId !== 'anonymous') {
    can('read', 'AIRequest', { userId: principal.userId });
  }
};
