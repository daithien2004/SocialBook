import type { AbilityDefinition } from '@/shared/casl/ability.factory';

export const defineTextToSpeechAbilities: AbilityDefinition = (
  principal,
  builder,
) => {
  const { can } = builder;

  can('read', 'TextToSpeech');
  can('update', 'TextToSpeech');

  if (principal.roles.includes('admin')) {
    can('manage', 'TextToSpeech');
  }
};
