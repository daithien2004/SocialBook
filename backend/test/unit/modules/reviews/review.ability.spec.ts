import { subject } from '@casl/ability';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { defineReviewAbilities } from '@/modules/reviews/application/policies/review.ability';

describe('Review abilities', () => {
  const abilityFactory = new AbilityFactory([defineReviewAbilities]);
  const approvedReview = {
    id: 'review-1',
    userId: 'user-1',
    moderationStatus: 'approved',
  };
  const pendingReview = {
    id: 'review-2',
    userId: 'user-2',
    moderationStatus: 'pending',
  };

  it('allows anonymous readers to read approved reviews only', () => {
    const ability = abilityFactory.createActor({
      userId: 'anonymous',
      roles: [],
    }).ability;

    expect(ability.can('read', subject('Review', approvedReview))).toBe(true);
    expect(ability.can('read', subject('Review', pendingReview))).toBe(false);
  });

  it('allows members to manage their own reviews and like approved reviews', () => {
    const ability = abilityFactory.createActor({
      userId: 'user-1',
      roles: ['user'],
    }).ability;

    expect(ability.can('create', 'Review')).toBe(true);
    expect(ability.can('update', subject('Review', approvedReview))).toBe(true);
    expect(ability.can('delete', subject('Review', approvedReview))).toBe(true);
    expect(ability.can('like', subject('Review', approvedReview))).toBe(true);
    expect(ability.can('update', subject('Review', pendingReview))).toBe(false);
  });
});
