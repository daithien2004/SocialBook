import { Post } from '@/modules/posts/domain/posts/entities/post.entity';

describe('Post optimistic-lock state', () => {
  it('tracks mutations and persisted versions', () => {
    const post = Post.create({
      id: '507f1f77bcf86cd799439011',
      userId: '507f1f77bcf86cd799439012',
      content: 'original',
    });

    expect(post.isNew).toBe(true);
    expect(post.isDirty).toBe(true);
    post.markPersisted(0);

    post.updateContent('edited');
    expect(post.loadedVersion).toBe(0);
    expect(post.isDirty).toBe(true);

    post.markPersisted(1);
    expect(post.loadedVersion).toBe(1);
    expect(post.isNew).toBe(false);
    expect(post.isDirty).toBe(false);
  });

  it('loads legacy records without a version as version zero', () => {
    const post = Post.reconstitute({
      id: '507f1f77bcf86cd799439011',
      userId: '507f1f77bcf86cd799439012',
      bookId: null,
      content: 'existing',
      imageUrls: [],
      isDeleted: false,
      isFlagged: false,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    });

    expect(post.loadedVersion).toBe(0);
    expect(post.isNew).toBe(false);
    expect(post.isDirty).toBe(false);
  });
});
