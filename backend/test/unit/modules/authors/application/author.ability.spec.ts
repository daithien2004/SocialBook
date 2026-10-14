import { subject } from '@casl/ability';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { defineAuthorAbilities } from '@/modules/authors/application/policies/author.ability';

describe('author abilities', () => {
  const abilityFactory = new AbilityFactory([defineAuthorAbilities]);

  it('allows public author reads and denies administration', () => {
    const ability = abilityFactory.createActor({
      userId: 'reader-1',
      roles: [],
    }).ability;

    expect(ability.can('read', 'Author')).toBe(true);
    expect(ability.can('create', 'Author')).toBe(false);
    expect(ability.can('read', 'AuthorAdministration')).toBe(false);
  });

  it('allows administrators to manage authors', () => {
    const ability = abilityFactory.createActor({
      userId: 'admin-1',
      roles: ['admin'],
    }).ability;

    expect(ability.can('create', 'Author')).toBe(true);
    expect(ability.can('update', subject('Author', { id: 'author-1' }))).toBe(
      true,
    );
    expect(ability.can('read', 'AuthorAdministration')).toBe(true);
  });
});
