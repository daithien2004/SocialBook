import { AbilityFactory } from '@/shared/casl/ability.factory';
import { defineGenreAbilities } from '@/modules/genres/application/policies/genre.ability';

describe('genre abilities', () => {
  const abilityFactory = new AbilityFactory([defineGenreAbilities]);

  it('allows public reads but reserves genre changes for administrators', () => {
    const ability = abilityFactory.createActor({
      userId: 'reader-1',
      roles: [],
    }).ability;

    expect(ability.can('read', 'Genre')).toBe(true);
    expect(ability.can('create', 'Genre')).toBe(false);
    expect(ability.can('read', 'GenreAdministration')).toBe(false);
  });

  it('allows administrators to manage genres and access admin routes', () => {
    const ability = abilityFactory.createActor({
      userId: 'admin-1',
      roles: ['admin'],
    }).ability;

    expect(ability.can('create', 'Genre')).toBe(true);
    expect(
      ability.can('update', { __caslSubjectType__: 'Genre', id: 'g-1' }),
    ).toBe(true);
    expect(ability.can('read', 'GenreAdministration')).toBe(true);
  });
});
