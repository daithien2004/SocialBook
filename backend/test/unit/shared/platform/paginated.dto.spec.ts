import { buildPaginationMeta } from '@/shared/domain/pagination.types';

describe('buildPaginationMeta', () => {
  it('builds offset metadata from the requested page and total', () => {
    expect(buildPaginationMeta(2, 10, 21)).toEqual({
      page: 2,
      pageSize: 10,
      total: 21,
      totalPages: 3,
    });
  });
});
