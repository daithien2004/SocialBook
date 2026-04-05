import { Post } from '@/domain/posts/entities/post.entity';

describe('Post Entity', () => {
  it('reject() should set rejected AND soft-delete', () => {
    const post = Post.create({ id: '1', userId: 'u1', content: 'Hello' });
    post.reject();

    expect(post.moderationStatus).toBe('rejected');
    expect(post.isDelete).toBe(true);
  });

  it('flag() → approve() should clear flagged state', () => {
    const post = Post.create({ id: '1', userId: 'u1', content: 'Hello' });
    post.flag('spam');
    post.approve();

    expect(post.isFlagged).toBe(false);
    expect(post.moderationStatus).toBe('approved');
  });

  it('imageUrls should be immutable from outside', () => {
    const post = Post.create({
      id: '1',
      userId: 'u1',
      content: 'Hi',
      imageUrls: ['a.jpg'],
    });
    post.imageUrls.push('hacked.jpg');

    expect(post.imageUrls).toEqual(['a.jpg']);
  });
});
