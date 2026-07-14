import { GetBookBySlugUseCase } from '@/application/books/use-cases/get-book-by-slug/get-book-by-slug.use-case';
import { GetBookBySlugQuery } from '@/application/books/use-cases/get-book-by-slug/get-book-by-slug.query';
import {
  BadRequestDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { IBookQueryProvider } from '@/domain/books/repositories/book-query.provider.interface';
import { IReviewRepository } from '@/domain/reviews/repositories/review.repository.interface';
import { BookDetailReadModel } from '@/domain/books/read-models/book-detail.read-model';
import { createMockCacheService } from '../../../../helpers/mock-cache-service';

function createMockBookQueryProvider(): jest.Mocked<IBookQueryProvider> {
  return {
    findAllList: jest.fn(),
    findDetailBySlug: jest.fn(),
    searchByText: jest.fn(),
    getGrowthMetrics: jest.fn(),
  };
}

function createMockReviewRepository(): jest.Mocked<IReviewRepository> {
  return {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findById: jest.fn(),
    findByBookId: jest.fn(),
    findByUserId: jest.fn(),
    toggleLike: jest.fn(),
    existsByUserAndBook: jest.fn(),
    getStatsForBooks: jest.fn(),
    countTotal: jest.fn(),
  };
}

function createMockBookDetail(
  overrides?: Partial<BookDetailReadModel>,
): BookDetailReadModel {
  return {
    id: 'book-1',
    title: 'Đắc Nhân Tâm',
    slug: 'dac-nhan-tam',
    authorId: 'author-1',
    authorName: 'Dale Carnegie',
    genres: [{ id: 'genre-1', name: 'Self-help', slug: 'self-help' }],
    description: 'Cuốn sách nổi tiếng',
    publishedYear: '1936',
    coverUrl: 'https://example.com/cover.jpg',
    status: 'published',
    tags: ['self-help'],
    likedBy: ['user-1'],
    stats: {
      views: 100,
      likes: 20,
      chapterCount: 10,
      averageRating: 0,
      totalRatings: 0,
    },
    chapters: [
      {
        id: 'ch-1',
        title: 'Chương 1',
        slug: 'chuong-1',
        content: 'Nội dung chương 1...',
        orderIndex: 1,
        viewsCount: 50,
        createdAt: new Date('2025-01-01'),
      },
    ],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-15'),
    ...overrides,
  };
}

describe('GetBookBySlugUseCase (Unit)', () => {
  let useCase: GetBookBySlugUseCase;
  let mockQueryProvider: ReturnType<typeof createMockBookQueryProvider>;
  let mockCache: ReturnType<typeof createMockCacheService>;
  let mockReviewRepo: ReturnType<typeof createMockReviewRepository>;

  beforeEach(() => {
    mockQueryProvider = createMockBookQueryProvider();
    mockCache = createMockCacheService();
    mockReviewRepo = createMockReviewRepository();

    useCase = new GetBookBySlugUseCase(
      mockQueryProvider,
      mockCache,
      mockReviewRepo,
    );
  });

  it('should return cached book when cache hits', async () => {
    const cachedBook = createMockBookDetail();
    mockCache.get.mockResolvedValue(cachedBook);

    const result = await useCase.execute(
      new GetBookBySlugQuery('dac-nhan-tam'),
    );

    expect(result).toEqual(cachedBook);
    expect(mockQueryProvider.findDetailBySlug).not.toHaveBeenCalled();
    expect(mockReviewRepo.getStatsForBooks).not.toHaveBeenCalled();
  });

  it('should query DB and cache result on cache miss', async () => {
    mockCache.get.mockResolvedValue(null);
    const book = createMockBookDetail();
    mockQueryProvider.findDetailBySlug.mockResolvedValue(book);
    const ratingStats = new Map<string, { rating: number; count: number }>();
    ratingStats.set(book.id, { rating: 4.5, count: 10 });
    mockReviewRepo.getStatsForBooks.mockResolvedValue(ratingStats);

    const result = await useCase.execute(
      new GetBookBySlugQuery('dac-nhan-tam'),
    );

    expect(result.stats.averageRating).toBe(4.5);
    expect(result.stats.totalRatings).toBe(10);
    expect(mockQueryProvider.findDetailBySlug).toHaveBeenCalledWith(
      'dac-nhan-tam',
    );
    expect(mockCache.set).toHaveBeenCalled();
  });

  it('should throw BadRequestDomainException when slug is empty', async () => {
    await expect(useCase.execute(new GetBookBySlugQuery(''))).rejects.toThrow(
      BadRequestDomainException,
    );
  });

  it('should throw NotFoundDomainException when book not found', async () => {
    mockCache.get.mockResolvedValue(null);
    mockQueryProvider.findDetailBySlug.mockResolvedValue(null);

    await expect(
      useCase.execute(new GetBookBySlugQuery('nonexistent-slug')),
    ).rejects.toThrow(NotFoundDomainException);
  });

  it('should handle missing rating stats gracefully', async () => {
    mockCache.get.mockResolvedValue(null);
    const book = createMockBookDetail();
    mockQueryProvider.findDetailBySlug.mockResolvedValue(book);
    mockReviewRepo.getStatsForBooks.mockResolvedValue(new Map());

    const result = await useCase.execute(
      new GetBookBySlugQuery('dac-nhan-tam'),
    );

    expect(result.stats.averageRating).toBe(0);
    expect(result.stats.totalRatings).toBe(0);
  });

  it('should propagate repository errors', async () => {
    mockCache.get.mockResolvedValue(null);
    mockQueryProvider.findDetailBySlug.mockRejectedValue(
      new Error('DB query failed'),
    );

    await expect(
      useCase.execute(new GetBookBySlugQuery('dac-nhan-tam')),
    ).rejects.toThrow('DB query failed');
  });
});
