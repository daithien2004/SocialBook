import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';

export function createMockChapterRepository(): jest.Mocked<IChapterRepository> {
  return {
    findById: jest.fn(),
    findByParagraphId: jest.fn(),
    findAll: jest.fn(),
    findByBook: jest.fn(),
    findListByBookSlug: jest.fn(),
    findDetailBySlug: jest.fn(),
    findNextChapter: jest.fn(),
    findPreviousChapter: jest.fn(),
    findFirstChapter: jest.fn(),
    findLastChapter: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    existsByTitle: jest.fn(),
    existsBySlug: jest.fn(),
    existsByOrderIndex: jest.fn(),
    incrementViews: jest.fn(),
    incrementViewsBySlug: jest.fn(),
    countByBook: jest.fn(),
    getTotalViewsByBook: jest.fn(),
    getMaxOrderIndex: jest.fn(),
    reorderChapters: jest.fn(),
    countChaptersForBooks: jest.fn(),
    countTotal: jest.fn(),
    updateTtsStatus: jest.fn(),
  };
}
