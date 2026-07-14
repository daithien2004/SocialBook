import { CreateBookUseCase } from '@/application/books/use-cases/create-book/create-book.use-case';
import { CreateBookCommand } from '@/application/books/use-cases/create-book/create-book.command';
import { ConflictDomainException } from '@/shared/domain/common-exceptions';
import { createMockBookRepository } from '../../../../helpers/mock-book-repository';
import { createMockBookCacheService } from '../../../../helpers/mock-cache-service';
import { createMockIdGenerator } from '../../../../helpers/mock-id-generator';
import { IAuthorRepository } from '@/domain/authors/repositories/author.repository.interface';
import { IGenreRepository } from '@/domain/genres/repositories/genre.repository.interface';
import { Book } from '@/domain/books/entities/book.entity';

describe('CreateBookUseCase (Unit)', () => {
  let useCase: CreateBookUseCase;
  let mockBookRepo: ReturnType<typeof createMockBookRepository>;
  let mockAuthorRepo: jest.Mocked<IAuthorRepository>;
  let mockGenreRepo: jest.Mocked<IGenreRepository>;
  let mockIdGenerator: ReturnType<typeof createMockIdGenerator>;
  let mockBookCache: ReturnType<typeof createMockBookCacheService>;
  let mockEventEmitter: { emit: jest.Mock };

  beforeEach(() => {
    mockBookRepo = createMockBookRepository();
    mockAuthorRepo = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      findAllSimple: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      existsByName: jest.fn(),
      countActive: jest.fn(),
      searchByName: jest.fn(),
    };
    mockGenreRepo = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findBySlugs: jest.fn(),
      findAll: jest.fn(),
      findAllSimple: jest.fn(),
      findByNames: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      existsByName: jest.fn(),
      countActive: jest.fn(),
    };
    mockIdGenerator = createMockIdGenerator('book-');
    mockBookCache = createMockBookCacheService();
    mockEventEmitter = { emit: jest.fn() };

    useCase = new CreateBookUseCase(
      mockBookRepo,
      mockAuthorRepo,
      mockGenreRepo,
      mockIdGenerator,
      mockBookCache,
      mockEventEmitter as never,
    );
  });

  it('should create a book successfully', async () => {
    mockBookRepo.existsByTitle.mockResolvedValue(false);

    const command = new CreateBookCommand({
      title: 'Đắc Nhân Tâm',
      authorId: 'author-1',
      genres: ['genre-1'],
      description: 'Cuốn sách hay',
      tags: ['self-help'],
    });

    const result = await useCase.execute(command);

    expect(result).toBeInstanceOf(Book);
    expect(result.title.toString()).toBe('Đắc Nhân Tâm');
    expect(mockBookRepo.save).toHaveBeenCalledTimes(1);
    expect(mockBookCache.setDetail).toHaveBeenCalledTimes(1);
  });

  it('should throw ConflictDomainException when title exists', async () => {
    mockBookRepo.existsByTitle.mockResolvedValue(true);

    const command = new CreateBookCommand({
      title: 'Duplicate Title',
      authorId: 'author-1',
      genres: ['genre-1'],
    });

    await expect(useCase.execute(command)).rejects.toThrow(
      ConflictDomainException,
    );
    expect(mockBookRepo.save).not.toHaveBeenCalled();
  });

  it('should throw when genres array is empty', async () => {
    mockBookRepo.existsByTitle.mockResolvedValue(false);

    const command = new CreateBookCommand({
      title: 'No Genre Book',
      authorId: 'author-1',
      genres: [],
    });

    await expect(useCase.execute(command)).rejects.toThrow(
      'Book must have at least one genre',
    );
    expect(mockBookRepo.save).not.toHaveBeenCalled();
  });

  it('should throw when genres exceed 5', async () => {
    mockBookRepo.existsByTitle.mockResolvedValue(false);

    const command = new CreateBookCommand({
      title: 'Too Many Genres',
      authorId: 'author-1',
      genres: ['1', '2', '3', '4', '5', '6'],
    });

    await expect(useCase.execute(command)).rejects.toThrow(
      'Book cannot have more than 5 genres',
    );
  });

  it('should auto-create author when authorName is new', async () => {
    mockBookRepo.existsByTitle.mockResolvedValue(false);
    mockAuthorRepo.findByName.mockResolvedValue(null);

    const command = new CreateBookCommand({
      title: 'New Author Book',
      authorId: 'new:',
      authorName: 'Tác giả mới',
      genres: ['genre-1'],
    });

    await useCase.execute(command);

    expect(mockAuthorRepo.save).toHaveBeenCalledTimes(1);
    expect(mockBookRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should auto-create genre when genreId starts with "new:"', async () => {
    mockBookRepo.existsByTitle.mockResolvedValue(false);
    mockGenreRepo.findByName.mockResolvedValue(null);

    const command = new CreateBookCommand({
      title: 'New Genre Book',
      authorId: 'author-1',
      genres: ['new:Thể loại mới'],
    });

    await useCase.execute(command);

    expect(mockGenreRepo.save).toHaveBeenCalledTimes(1);
    expect(mockBookRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should propagate repository errors', async () => {
    mockBookRepo.existsByTitle.mockRejectedValue(
      new Error('DB connection failed'),
    );

    const command = new CreateBookCommand({
      title: 'Error Book',
      authorId: 'author-1',
      genres: ['genre-1'],
    });

    await expect(useCase.execute(command)).rejects.toThrow(
      'DB connection failed',
    );
  });
});
