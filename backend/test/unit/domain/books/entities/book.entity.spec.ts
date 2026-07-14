import { Book } from '@/domain/books/entities/book.entity';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { BookStatus } from '@/domain/books/value-objects/book-status.vo';
import { GenreId } from '@/domain/books/value-objects/genre-id.vo';

describe('Book Entity (Unit)', () => {
  describe('create', () => {
    it('should create a new book with defaults', () => {
      const book = Book.create({
        id: BookId.create('book-1'),
        title: 'Đắc Nhân Tâm',
        authorId: 'author-1',
        genres: ['genre-1'],
      });

      expect(book.id.toString()).toBe('book-1');
      expect(book.slug).toBe('dac-nhan-tam');
      expect(book.status.isDraft()).toBe(true);
      expect(book.views).toBe(0);
      expect(book.likes).toBe(0);
      expect(book.likedBy).toEqual([]);
      expect(book.description).toBe('');
    });

    it('should create book with specified status', () => {
      const book = Book.create({
        id: BookId.create('book-2'),
        title: 'Test Book',
        authorId: 'author-1',
        genres: ['genre-1'],
        status: 'published',
      });

      expect(book.status.isPublished()).toBe(true);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute a book from persistence', () => {
      const createdAt = new Date('2025-01-01');
      const updatedAt = new Date('2025-01-15');

      const book = Book.reconstitute({
        id: 'book-1',
        title: 'Đắc Nhân Tâm',
        slug: 'dac-nhan-tam',
        authorId: 'author-1',
        genres: ['genre-1'],
        description: 'A great book',
        publishedYear: '1936',
        coverUrl: 'https://example.com/cover.jpg',
        status: 'published',
        tags: ['self-help'],
        views: 100,
        likes: 20,
        likedBy: ['user-1', 'user-2'],
        createdAt,
        updatedAt,
      });

      expect(book.id.toString()).toBe('book-1');
      expect(book.views).toBe(100);
      expect(book.likes).toBe(20);
      expect(book.likedBy).toHaveLength(2);
    });

    it('should reconstitute with optional fields', () => {
      const book = Book.reconstitute({
        id: 'book-2',
        title: 'Test Book',
        slug: 'test-book',
        authorId: 'author-1',
        genres: ['genre-1'],
        description: '',
        publishedYear: '',
        coverUrl: '',
        status: 'draft',
        tags: [],
        views: 0,
        likes: 0,
        likedBy: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        authorName: 'Nguyễn Văn A',
        chapterCount: 5,
      });

      expect(book.authorName).toBe('Nguyễn Văn A');
      expect(book.chapterCount).toBe(5);
    });
  });

  describe('business methods', () => {
    let book: Book;

    beforeEach(() => {
      book = Book.create({
        id: BookId.create('book-1'),
        title: 'Original Title',
        authorId: 'author-1',
        genres: ['genre-1'],
      });
    });

    it('changeTitle should update title and slug', () => {
      book.changeTitle('New Title');

      expect(book.title.toString()).toBe('New Title');
      expect(book.slug).toBe('new-title');
    });

    it('changeAuthor should update authorId', () => {
      book.changeAuthor('author-2');

      expect(book.authorId.toString()).toBe('author-2');
    });

    it('updateGenres should update genres', () => {
      book.updateGenres(['genre-1', 'genre-2', 'genre-3']);

      expect(book.genres).toHaveLength(3);
      expect(book.genres.map((g) => g.toString())).toEqual([
        'genre-1',
        'genre-2',
        'genre-3',
      ]);
    });

    it('updateGenres should throw on empty genres', () => {
      expect(() => book.updateGenres([])).toThrow(
        'Book must have at least one genre',
      );
    });

    it('updateGenres should throw on more than 5 genres', () => {
      expect(() => book.updateGenres(['1', '2', '3', '4', '5', '6'])).toThrow(
        'Book cannot have more than 5 genres',
      );
    });

    it('incrementViews should increase view count', () => {
      book.incrementViews();
      expect(book.views).toBe(1);
    });

    it('addLike should add user and increment likes', () => {
      book.addLike('user-3');

      expect(book.likedBy).toContain('user-3');
      expect(book.likes).toBe(1);
    });

    it('addLike should ignore duplicate user', () => {
      book.addLike('user-3');
      book.addLike('user-3');

      expect(book.likedBy).toHaveLength(1);
      expect(book.likes).toBe(1);
    });

    it('removeLike should remove user and decrement likes', () => {
      book.addLike('user-3');
      book.removeLike('user-3');

      expect(book.likedBy).not.toContain('user-3');
      expect(book.likes).toBe(0);
    });

    it('removeLike should do nothing for non-existent user', () => {
      book.removeLike('nonexistent-user');

      expect(book.likes).toBe(0);
    });

    it('changeStatus should change status', () => {
      book.changeStatus('published');
      expect(book.status.isPublished()).toBe(true);

      book.changeStatus('completed');
      expect(book.status.isCompleted()).toBe(true);
    });
  });

  describe('defensive copy (immutability)', () => {
    it('genres should be immutable via getter', () => {
      const book = Book.create({
        id: BookId.create('book-1'),
        title: 'Test Genres',
        authorId: 'author-1',
        genres: ['genre-1'],
      });

      const genres = book.genres;
      genres.push(GenreId.create('hacked-genre'));

      expect(book.genres).toHaveLength(1);
    });

    it('likedBy should be immutable via getter', () => {
      const book = Book.reconstitute({
        id: 'book-1',
        title: 'Test Liked',
        slug: 'test-liked',
        authorId: 'author-1',
        genres: ['genre-1'],
        description: '',
        publishedYear: '',
        coverUrl: '',
        status: 'published',
        tags: [],
        views: 0,
        likes: 0,
        likedBy: ['user-1'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const likedBy = book.likedBy;
      likedBy.push('hacked-user');

      expect(book.likedBy).toHaveLength(1);
    });

    it('tags should be immutable via getter', () => {
      const book = Book.create({
        id: BookId.create('book-1'),
        title: 'Test Tags',
        authorId: 'author-1',
        genres: ['genre-1'],
        tags: ['tag-1', 'tag-2'],
      });

      const tags = book.tags;
      tags.push('hacked-tag');

      expect(book.tags).toHaveLength(2);
    });
  });
});
