import { AbilityFactory } from '@/shared/casl/ability.factory';
import { defineStatisticsAbilities } from '@/modules/statistics/application/policies/statistics.ability';

describe('statistics abilities', () => {
  const abilityFactory = new AbilityFactory([defineStatisticsAbilities]);

  it.each(['admin', 'editor'])('allows %s to read statistics', (role) => {
    const actor = abilityFactory.createActor({
      userId: 'user-1',
      roles: [role],
    });

    expect(actor.ability.can('read', 'Statistics')).toBe(true);
  });

  it('does not allow a regular user to read statistics', () => {
    const actor = abilityFactory.createActor({
      userId: 'user-1',
      roles: ['user'],
    });

    expect(actor.ability.can('read', 'Statistics')).toBe(false);
  });
});
