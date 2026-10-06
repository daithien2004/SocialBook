import { presenceChangesSchema } from '../useReadingRoomSocket';

describe('presenceChangesSchema', () => {
  it('accepts progress expressed as a percentage', () => {
    const result = presenceChangesSchema.safeParse([
      {
        action: 'upsert',
        presence: {
          userId: 'user-1',
          displayName: 'Reader',
          currentChapterSlug: 'chapter-1',
          progress: 42,
        },
      },
    ]);

    expect(result.success).toBe(true);
  });

  it('rejects progress outside the percentage range', () => {
    const result = presenceChangesSchema.safeParse([
      {
        action: 'upsert',
        presence: {
          userId: 'user-1',
          displayName: 'Reader',
          currentChapterSlug: 'chapter-1',
          progress: 101,
        },
      },
    ]);

    expect(result.success).toBe(false);
  });
});
