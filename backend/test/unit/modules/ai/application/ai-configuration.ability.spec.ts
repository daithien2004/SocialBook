import { AbilityFactory } from '@/shared/casl/ability.factory';
import { defineAiConfigurationAbilities } from '@/modules/ai/application/policies/ai-configuration.ability';

describe('AI configuration abilities', () => {
  const abilityFactory = new AbilityFactory([defineAiConfigurationAbilities]);

  it('limits configuration access to administrators', () => {
    const userAbility = abilityFactory.createActor({
      userId: 'user-1',
      roles: ['user'],
    }).ability;
    const adminAbility = abilityFactory.createActor({
      userId: 'admin-1',
      roles: ['admin'],
    }).ability;

    expect(userAbility.can('read', 'AIRateLimitConfiguration')).toBe(false);
    expect(userAbility.can('update', 'AIRateLimitConfiguration')).toBe(false);
    expect(adminAbility.can('read', 'AIRateLimitConfiguration')).toBe(true);
    expect(adminAbility.can('update', 'AIRateLimitConfiguration')).toBe(true);
  });
});
