import { GetChapterBySlugUseCase } from '@/application/chapters/use-cases/get-chapter-by-slug/get-chapter-by-slug.use-case';
import { GetChapterBySlugQuery } from '@/application/chapters/use-cases/get-chapter-by-slug/get-chapter-by-slug.query';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { ChapterDetailReadModel } from '@/domain/chapters/read-models/chapter-detail.read-model';
import { createMockChapterRepository } from '../../../../helpers/mock-chapter-repository';

function createMockChapterDetail(
  overrides?: Partial<ChapterDetailReadModel>,
): ChapterDetailReadModel {
  return {
    book: {
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
      tags: [],
      likedBy: [],
      stats: { views: 100, likes: 20, chapterCount: 10 },
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-15'),
    },
    chapter: {
      id: 'chapter-1',
      bookId: 'book-1',
      title: 'Chương 1: Khởi đầu',
      slug: 'chuong-1-khoi-dau',
      orderIndex: 1,
      viewsCount: 50,
      paragraphs: [
        { id: 'para-1', content: 'Đoạn văn đầu tiên.' },
        { id: 'para-2', content: 'Đoạn văn thứ hai.' },
      ],
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-15'),
    },
    navigation: {
      previous: null,
      next: {
        id: 'chapter-2',
        title: 'Chương 2',
        slug: 'chuong-2',
        orderIndex: 2,
      },
    },
    ...overrides,
  };
}

describe('GetChapterBySlugUseCase (Unit)', () => {
  let useCase: GetChapterBySlugUseCase;
  let mockChapterRepo: ReturnType<typeof createMockChapterRepository>;

  beforeEach(() => {
    mockChapterRepo = createMockChapterRepository();
    useCase = new GetChapterBySlugUseCase(mockChapterRepo);
  });

  it('should return chapter detail with navigation', async () => {
    const expected = createMockChapterDetail();
    mockChapterRepo.findDetailBySlug.mockResolvedValue(expected);

    const result = await useCase.execute(
      new GetChapterBySlugQuery('chuong-1-khoi-dau', 'dac-nhan-tam'),
    );

    expect(result).toEqual(expected);
    expect(mockChapterRepo.findDetailBySlug).toHaveBeenCalledWith(
      'chuong-1-khoi-dau',
      'dac-nhan-tam',
    );
  });

  it('should include navigation with both prev and next', async () => {
    const expected = createMockChapterDetail({
      navigation: {
        previous: {
          id: 'prev-chapter',
          title: 'Mở đầu',
          slug: 'mo-dau',
          orderIndex: 0,
        },
        next: {
          id: 'next-chapter',
          title: 'Chương 2',
          slug: 'chuong-2',
          orderIndex: 2,
        },
      },
    });
    mockChapterRepo.findDetailBySlug.mockResolvedValue(expected);

    const result = await useCase.execute(
      new GetChapterBySlugQuery('chuong-1', 'dac-nhan-tam'),
    );

    expect(result.navigation.previous).not.toBeNull();
    expect(result.navigation.next).not.toBeNull();
    expect(result.navigation.previous!.slug).toBe('mo-dau');
    expect(result.navigation.next!.slug).toBe('chuong-2');
  });

  it('should return null navigation for first/last chapters', async () => {
    const firstChapter = createMockChapterDetail({
      navigation: {
        previous: null,
        next: { id: 'ch2', title: 'Chương 2', slug: 'chuong-2', orderIndex: 2 },
      },
    });
    mockChapterRepo.findDetailBySlug.mockResolvedValue(firstChapter);

    const result = await useCase.execute(
      new GetChapterBySlugQuery('chuong-1', 'dac-nhan-tam'),
    );

    expect(result.navigation.previous).toBeNull();
    expect(result.navigation.next).not.toBeNull();
  });

  it('should throw NotFoundDomainException when chapter not found', async () => {
    mockChapterRepo.findDetailBySlug.mockResolvedValue(null);

    await expect(
      useCase.execute(new GetChapterBySlugQuery('nonexistent', 'book-slug')),
    ).rejects.toThrow(NotFoundDomainException);
  });

  it('should propagate repository errors', async () => {
    mockChapterRepo.findDetailBySlug.mockRejectedValue(
      new Error('DB query failed'),
    );

    await expect(
      useCase.execute(new GetChapterBySlugQuery('chuong-1', 'dac-nhan-tam')),
    ).rejects.toThrow('DB query failed');
  });
});
