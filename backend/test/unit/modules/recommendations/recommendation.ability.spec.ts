import { AbilityFactory } from '@/shared/casl/ability.factory';
import { defineRecommendationAbilities } from '@/modules/recommendations/application/policies/recommendation.ability';

describe('Recommendation abilities', () => {
  const abilityFactory = new AbilityFactory([defineRecommendationAbilities]);

  it('allows authenticated users to read personalized recommendations', () => {
    const actor = abilityFactory.createActor({
      userId: 'user-1',
      roles: ['user'],
    });

    expect(actor.ability.can('read', 'Recommendation')).toBe(true);
  });

  it('does not allow anonymous access to personalized recommendations', () => {
    const actor = abilityFactory.createActor({
      userId: 'anonymous',
      roles: [],
    });

    expect(actor.ability.can('read', 'Recommendation')).toBe(false);
  });
});
