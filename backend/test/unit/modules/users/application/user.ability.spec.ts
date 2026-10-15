import { subject } from '@casl/ability';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { defineUserAbilities } from '@/modules/users/application/policies/user.ability';

describe('user abilities', () => {
  const abilityFactory = new AbilityFactory([defineUserAbilities]);

  it('allows a user to read only their own summary', () => {
    const ability = abilityFactory.createActor({
      userId: 'user-1',
      roles: ['user'],
    }).ability;

    expect(ability.can('read', subject('User', { id: 'user-1' }))).toBe(true);
    expect(ability.can('read', subject('User', { id: 'user-2' }))).toBe(false);
    expect(ability.can('read', 'PublicUser')).toBe(true);
  });

  it('allows administrators to read users', () => {
    const ability = abilityFactory.createActor({
      userId: 'admin-1',
      roles: ['admin'],
    }).ability;

    expect(ability.can('read', subject('User', { id: 'user-2' }))).toBe(true);
  });
});
