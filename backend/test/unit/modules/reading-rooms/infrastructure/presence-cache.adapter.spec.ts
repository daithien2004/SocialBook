import { isPresenceData } from '@/modules/reading-rooms/infrastructure/cache/presence-cache.adapter';

describe('isPresenceData', () => {
  const validPresence = {
    userId: 'user-id',
    displayName: 'Reader',
    avatarUrl: '',
    currentChapterSlug: 'chapter-one',
    lastSeen: 1_000,
  };

  it('accepts valid optional presence fields', () => {
    expect(
      isPresenceData({
        ...validPresence,
        paragraphId: 'paragraph-id',
        progress: 42,
      }),
    ).toBe(true);
  });

  it.each([
    { paragraphId: 42 },
    { progress: '42' },
    { progress: 101 },
    { progress: Number.NaN },
    { lastSeen: Number.POSITIVE_INFINITY },
  ])('rejects invalid cached fields: %o', (invalidFields) => {
    expect(isPresenceData({ ...validPresence, ...invalidFields })).toBe(false);
  });
});
