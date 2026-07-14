import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';

export function createMockBookRepository(): jest.Mocked<IBookRepository> {
  return {
    findById: jest.fn(),
    findBySlug: jest.fn(),
    findByTitle: jest.fn(),
    findAll: jest.fn(),
    findByAuthor: jest.fn(),
    findByGenre: jest.fn(),
    findPopular: jest.fn(),
    findRecent: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    softDelete: jest.fn(),
    existsByTitle: jest.fn(),
    existsBySlug: jest.fn(),
    existsById: jest.fn(),
    incrementViews: jest.fn(),
    addLike: jest.fn(),
    removeLike: jest.fn(),
    countByAuthor: jest.fn(),
    countByGenre: jest.fn(),
    countByStatus: jest.fn(),
    countTotal: jest.fn(),
    countByGenreName: jest.fn(),
    countByTags: jest.fn(),
    findByIds: jest.fn(),
    findIdsByFilter: jest.fn(),
    findSearchCandidates: jest.fn(),
    getFilters: jest.fn(),
  };
}
