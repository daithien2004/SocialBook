import { defineRulesFor, canAccess } from './define-ability';
import { subject } from '@casl/ability';

describe('define-ability', () => {
  it('should grant full access to admin role', () => {
    const ability = defineRulesFor('admin');
    expect(ability.can('manage', 'all')).toBe(true);
    expect(ability.can('create', 'Post')).toBe(true);
    expect(canAccess(ability, 'manage', 'all')).toBe(true);
  });

  it('should deny access if role is user and no user id provided', () => {
    const ability = defineRulesFor('user');
    expect(ability.can('update', 'Post')).toBe(false);
    expect(ability.can('manage', 'all')).toBe(false);
  });

  it('should grant update/delete access to owners based on userId', () => {
    const currentUserId = 'user-123';
    const ability = defineRulesFor('user', currentUserId);

    // Can update their own post
    const myPost = subject('Post', { userId: 'user-123' });
    expect(ability.can('update', myPost)).toBe(true);
    expect(ability.can('delete', myPost)).toBe(true);

    // Cannot update someone else's post
    const otherPost = subject('Post', { userId: 'user-456' });
    expect(ability.can('update', otherPost)).toBe(false);
    expect(ability.can('delete', otherPost)).toBe(false);
  });

  it('should grant update/delete access to other owned entities', () => {
    const currentUserId = 'user-123';
    const ability = defineRulesFor('user', currentUserId);

    expect(ability.can('delete', subject('Comment', { userId: 'user-123' }))).toBe(true);
    expect(ability.can('update', subject('Review', { userId: 'user-123' }))).toBe(true);
    expect(ability.can('delete', subject('RoomReaction', { userId: 'user-123' }))).toBe(true);
    expect(ability.can('update', subject('Collection', { userId: 'user-456' }))).toBe(false);
  });
});
