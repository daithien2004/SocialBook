import { subject } from '@casl/ability';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { defineBookAbilities } from '@/modules/books/application/policies/book.ability';

describe('Book abilities', () => {
  const abilityFactory = new AbilityFactory([defineBookAbilities]);

  it('allows anonymous readers to read published books only', () => {
    const ability = abilityFactory.createActor({
      userId: 'anonymous',
      roles: [],
    }).ability;

    expect(
      ability.can(
        'read',
        subject('Book', {
          id: 'book-1',
          status: 'published',
          isDeleted: false,
        }),
      ),
    ).toBe(true);
    expect(
      ability.can(
        'read',
        subject('Book', {
          id: 'book-2',
          status: 'draft',
          isDeleted: false,
        }),
      ),
    ).toBe(false);
  });

  it('allows administrators to manage books', () => {
    const ability = abilityFactory.createActor({
      userId: 'admin-1',
      roles: ['admin'],
    }).ability;

    expect(ability.can('create', 'Book')).toBe(true);
    expect(
      ability.can(
        'delete',
        subject('Book', {
          id: 'book-1',
          status: 'draft',
          isDeleted: false,
        }),
      ),
    ).toBe(true);
  });
});
