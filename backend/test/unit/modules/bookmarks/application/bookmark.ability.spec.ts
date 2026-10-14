import { subject } from '@casl/ability';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { defineBookmarkAbilities } from '@/modules/bookmarks/application/policies/bookmark.ability';

describe('bookmark abilities', () => {
  const abilityFactory = new AbilityFactory([defineBookmarkAbilities]);

  it('allows a user to read and delete only their own bookmarks', () => {
    const ability = abilityFactory.createActor({
      userId: 'user-1',
      roles: ['user'],
    }).ability;

    expect(
      ability.can(
        'read',
        subject('Bookmark', { id: 'bookmark-1', userId: 'user-1' }),
      ),
    ).toBe(true);
    expect(
      ability.can(
        'delete',
        subject('Bookmark', { id: 'bookmark-2', userId: 'user-2' }),
      ),
    ).toBe(false);
    expect(ability.can('create', 'Bookmark')).toBe(true);
  });

  it('allows administrators to manage bookmarks', () => {
    const ability = abilityFactory.createActor({
      userId: 'admin-1',
      roles: ['admin'],
    }).ability;

    expect(ability.can('delete', 'Bookmark')).toBe(true);
  });
});
