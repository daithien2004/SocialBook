import { Book } from '@/modules/books/domain/books/entities/book.entity';
import { BookId } from '@/modules/books/domain/books/value-objects/book-id.vo';

describe('Book optimistic-lock state', () => {
  it('tracks new, dirty, and persisted versions', () => {
    const book = Book.create({
      id: BookId.create('507f1f77bcf86cd799439011'),
      title: 'A Book',
      authorId: '507f1f77bcf86cd799439012',
      genres: ['507f1f77bcf86cd799439013'],
    });

    expect(book.isNew).toBe(true);
    expect(book.isDirty).toBe(true);
    expect(book.loadedVersion).toBe(0);

    book.markPersisted(0);
    book.updateDescription('Updated description');
    expect(book.isNew).toBe(false);
    expect(book.isDirty).toBe(true);

    book.markPersisted(1);
    expect(book.loadedVersion).toBe(1);
    expect(book.isDirty).toBe(false);
  });

  it('treats a legacy document without version as version zero', () => {
    const book = Book.reconstitute({
      id: '507f1f77bcf86cd799439011',
      title: 'A Book',
      slug: 'a-book',
      authorId: '507f1f77bcf86cd799439012',
      genres: ['507f1f77bcf86cd799439013'],
      description: '',
      publishedYear: '',
      coverUrl: '',
      status: 'draft',
      tags: [],
      views: 0,
      likes: 0,
      likedBy: [],
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    });

    expect(book.isNew).toBe(false);
    expect(book.isDirty).toBe(false);
    expect(book.loadedVersion).toBe(0);
  });
});
