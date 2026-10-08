import { paginated, unpaginated } from '@/shared/platform/dto/paginated.dto';

describe('paginated response helper', () => {
  it('maps internal offset metadata to the public page field', () => {
    expect(
      paginated(['book'], {
        current: 2,
        pageSize: 10,
        total: 21,
        totalPages: 3,
      }),
    ).toEqual({
      data: ['book'],
      meta: {
        page: 2,
        pageSize: 10,
        total: 21,
        totalPages: 3,
      },
    });
  });

  it('preserves cursor metadata', () => {
    expect(
      paginated(['post'], {
        limit: 20,
        nextCursor: 'cursor-2',
        hasMore: true,
      }),
    ).toEqual({
      data: ['post'],
      meta: {
        limit: 20,
        nextCursor: 'cursor-2',
        hasMore: true,
      },
    });
  });

  it('creates offset metadata for a complete unpaged collection', () => {
    expect(unpaginated(['author', 'author-2'])).toEqual({
      data: ['author', 'author-2'],
      meta: {
        page: 1,
        pageSize: 2,
        total: 2,
        totalPages: 1,
      },
    });
  });

  it('represents an empty unpaged collection with zero total pages', () => {
    expect(unpaginated([])).toEqual({
      data: [],
      meta: {
        page: 1,
        pageSize: 0,
        total: 0,
        totalPages: 0,
      },
    });
  });
});
